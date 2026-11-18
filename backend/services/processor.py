import numpy as np
import pandas as pd
from schemas.apk import APK

def process_features(raw_features: dict, feature_names=None):
    features = APK.model_validate(raw_features)

    expected = list(APK.model_fields)
    columns = list(feature_names) if feature_names is not None else expected

    if len(columns) != len(expected) or set(columns) != set(expected):
        raise ValueError("Feature names do not match the expected schema.")

    X = pd.DataFrame(
        [features.model_dump()],
        columns=columns,
        dtype=np.float64,
    )

    return np.log1p(X)