import re
from collections import Counter
from pathlib import Path
from zipfile import ZipFile

import numpy as np
from androguard.core.apk import APK
from androguard.core.dex import DEX

FEATURE_NAMES = """
IPCAbuse NDK ServiceLifecycle WorkManager TotalJavaFile
JavaLangReflectMethod RootAccess ReadSms ContentResolver UseFingerprint
JavaSecurityCertX509Certificate ReceiveSms CustomPermission BluetoothAdmin
JavaNetSocket UpdateAppOpsStats IntentSniffing JavaNetUrl UseBiometric
AccessNetworkState AccountManager WebViewExploits ReadUserDictionary
ContentProvider Vibrate1 ChangeWifiState1 JavaxNetSslSslsocket
JavaSecurityCertCertificateFactory JavaNioFileAttributeFileTime
JavaNetHttpURLConnection JavaNetUri JavaSecurityKeyPair
JavaNioFileStandardCopyOption JavaSecurityKeyFactory JavaNetInetAddress
JavaNioFileAttributeUserPrincipal CheckSelfPermissionCallCount
GetConnectionInfoCallCount GetSubscriberIdCallCount GetDeviceIdCallCount
GetDrawableOccurrences OnResumeOccurrences ConnectOccurrences OnTouchCallCount
NewWakeLockCallCount SetProgressOccurrences GetPackageInfoCallCount
RemoveOccurrences EnqueueOccurrences GetSystemServiceCallCount CancelOccurrences
SetAccessibleCallCount OpenConnectionCallCount RegisterListenerCallCount
GetContentResolverCallCount RegisterListenerOccurrences
RequestPermissionsCallCount GetPrimaryClipCallCount GetPrimaryClipOccurrences
OnPauseCallCount GetSimSerialNumberCallCount Internet AccessCoarseLocation
Vibrate AccessFineLocation SendSms ChangeWifiState Bluetooth
""".split()

ANDROID_NAME = "{http://schemas.android.com/apk/res/android}name"
DEX_FILENAME = re.compile(r"classes(?:[0-9]+)?\.dex")
INVOKED_METHOD = re.compile(r"->([^(\s]+)\(")

PERMISSIONS = {
    "ReadSms": "READ_SMS",
    "UseFingerprint": "USE_FINGERPRINT",
    "ReceiveSms": "RECEIVE_SMS",
    "BluetoothAdmin": "BLUETOOTH_ADMIN",
    "UpdateAppOpsStats": "UPDATE_APP_OPS_STATS",
    "UseBiometric": "USE_BIOMETRIC",
    "AccessNetworkState": "ACCESS_NETWORK_STATE",
    "AccountManager": "ACCOUNT_MANAGER",
    "ReadUserDictionary": "READ_USER_DICTIONARY",
    "Vibrate1": "VIBRATE",
    "ChangeWifiState1": "CHANGE_WIFI_STATE",
    "Internet": "INTERNET",
    "AccessCoarseLocation": "ACCESS_COARSE_LOCATION",
    "Vibrate": "VIBRATE",
    "AccessFineLocation": "ACCESS_FINE_LOCATION",
    "SendSms": "SEND_SMS",
    "ChangeWifiState": "CHANGE_WIFI_STATE",
    "Bluetooth": "BLUETOOTH",
}

DEX_TYPES = {
    "WorkManager": "Landroidx/work/WorkManager;",
    "JavaLangReflectMethod": "Ljava/lang/reflect/Method;",
    "ContentResolver": "Landroid/content/ContentResolver;",
    "JavaSecurityCertX509Certificate": "Ljava/security/cert/X509Certificate;",
    "JavaNetSocket": "Ljava/net/Socket;",
    "JavaNetUrl": "Ljava/net/URL;",
    "JavaxNetSslSslsocket": "Ljavax/net/ssl/SSLSocket;",
    "JavaSecurityCertCertificateFactory": "Ljava/security/cert/CertificateFactory;",
    "JavaNioFileAttributeFileTime": "Ljava/nio/file/attribute/FileTime;",
    "JavaNetHttpURLConnection": "Ljava/net/HttpURLConnection;",
    "JavaNetUri": "Ljava/net/URI;",
    "JavaSecurityKeyPair": "Ljava/security/KeyPair;",
    "JavaNioFileStandardCopyOption": "Ljava/nio/file/StandardCopyOption;",
    "JavaSecurityKeyFactory": "Ljava/security/KeyFactory;",
    "JavaNetInetAddress": "Ljava/net/InetAddress;",
    "JavaNioFileAttributeUserPrincipal": "Ljava/nio/file/attribute/UserPrincipal;",
}

FALLBACK_FEATURES = (
    "IPCAbuse",
    "RootAccess",
    "IntentSniffing",
    "WebViewExploits",
)


def extract_features(apk_path: Path) -> dict[str, int]:
    """Return raw Guardroid counts in training column order."""
    apk = APK(str(apk_path))
    manifest = apk.get_android_manifest_xml()
    if manifest is None:
        raise ValueError("Could not decode AndroidManifest.xml.")

    features = dict.fromkeys(FEATURE_NAMES, 0)

    requested_permissions = Counter(
        element.get(ANDROID_NAME)
        for element in manifest
        if element.tag in {"uses-permission", "uses-permission-sdk-23"}
    )

    for feature, permission in PERMISSIONS.items():
        count = requested_permissions[f"android.permission.{permission}"]
        features[feature] = int(count > 0) if feature == "ReadUserDictionary" else count

    features["ServiceLifecycle"] = len(manifest.findall("./application/service"))
    features["ContentProvider"] = len(manifest.findall("./application/provider"))
    features["CustomPermission"] = len(manifest.findall("./permission"))

    method_entries = Counter()
    call_sites = Counter()
    dex_type_presence = Counter()

    with ZipFile(apk_path) as archive:
        entries = archive.namelist()
        features["NDK"] = sum(
            entry.startswith("lib/") and entry.endswith(".so")
            for entry in entries
        )

        for entry in entries:
            if not DEX_FILENAME.fullmatch(entry):
                continue

            dex = DEX(archive.read(entry))

            # DEX class definitions are the proxy for Java source files.
            features["TotalJavaFile"] += len(dex.get_classes())

            # Each exact descriptor contributes at most once per DEX.
            dex_type_presence.update(
                {dex.get_cm_type(i) for i in range(dex.header.type_ids_size)}
            )

            method_entries.update(method.get_name() for method in dex.get_methods())

            for method in dex.get_encoded_methods():
                if method.get_code() is None:
                    continue

                for instruction in method.get_instructions():
                    if instruction.get_name().startswith("invoke-"):
                        match = INVOKED_METHOD.search(instruction.get_output())
                        if match:
                            call_sites[match.group(1)] += 1

    for feature, descriptor in DEX_TYPES.items():
        features[feature] = dex_type_presence[descriptor]

    for feature in FEATURE_NAMES:
        if feature.endswith("CallCount"):
            suffix = "CallCount"
            counts = call_sites
        elif feature.endswith("Occurrences"):
            suffix = "Occurrences"
            counts = method_entries
        else:
            continue

        stem = feature.removesuffix(suffix)
        method_name = stem[0].lower() + stem[1:]
        features[feature] = counts[method_name]

    print("Features:", features)
    return features

def extract_vector(apk_path: Path) -> np.ndarray:
    """Return the 68 raw values as a one-dimensional NumPy array."""
    features = extract_features(apk_path)
    vect = np.array([features[name] for name in FEATURE_NAMES], dtype=np.int64)
    print("That's vect: ", vect)
    return vect

