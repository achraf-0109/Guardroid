from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field

Count = Annotated[int, Field(ge=0)]

class APK(BaseModel):
    model_config = ConfigDict(extra="forbid")

    IPCAbuse: Count
    NDK: Count
    ServiceLifecycle: Count
    WorkManager: Count
    TotalJavaFile: Count
    JavaLangReflectMethod: Count
    RootAccess: Count
    ReadSms: Count
    ContentResolver: Count
    UseFingerprint: Count
    JavaSecurityCertX509Certificate: Count
    ReceiveSms: Count
    CustomPermission: Count
    BluetoothAdmin: Count
    JavaNetSocket: Count
    UpdateAppOpsStats: Count
    IntentSniffing: Count
    JavaNetUrl: Count
    UseBiometric: Count
    AccessNetworkState: Count
    AccountManager: Count
    WebViewExploits: Count
    ReadUserDictionary: Count
    ContentProvider: Count
    Vibrate1: Count
    ChangeWifiState1: Count
    JavaxNetSslSslsocket: Count
    JavaSecurityCertCertificateFactory: Count
    JavaNioFileAttributeFileTime: Count
    JavaNetHttpURLConnection: Count
    JavaNetUri: Count
    JavaSecurityKeyPair: Count
    JavaNioFileStandardCopyOption: Count
    JavaSecurityKeyFactory: Count
    JavaNetInetAddress: Count
    JavaNioFileAttributeUserPrincipal: Count
    CheckSelfPermissionCallCount: Count
    GetConnectionInfoCallCount: Count
    GetSubscriberIdCallCount: Count
    GetDeviceIdCallCount: Count
    GetDrawableOccurrences: Count
    OnResumeOccurrences: Count
    ConnectOccurrences: Count
    OnTouchCallCount: Count
    NewWakeLockCallCount: Count
    SetProgressOccurrences: Count
    GetPackageInfoCallCount: Count
    RemoveOccurrences: Count
    EnqueueOccurrences: Count
    GetSystemServiceCallCount: Count
    CancelOccurrences: Count
    SetAccessibleCallCount: Count
    OpenConnectionCallCount: Count
    RegisterListenerCallCount: Count
    GetContentResolverCallCount: Count
    RegisterListenerOccurrences: Count
    RequestPermissionsCallCount: Count
    GetPrimaryClipCallCount: Count
    GetPrimaryClipOccurrences: Count
    OnPauseCallCount: Count
    GetSimSerialNumberCallCount: Count
    Internet: Count
    AccessCoarseLocation: Count
    Vibrate: Count
    AccessFineLocation: Count
    SendSms: Count
    ChangeWifiState: Count
    Bluetooth: Count