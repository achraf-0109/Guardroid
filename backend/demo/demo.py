import joblib
import numpy as np
import pandas as pd

model = joblib.load("artifacts/guardroid_model.joblib")

raw_vector = np.array([
    # First 10 features: IPCAbuse through UseFingerprint
    0, 2, 3, 0, 4, 4, 0, 0, 6, 0,
    # Remaining 58 features
    *([0] * 58),
], dtype=np.int64)

feature_names = list(model.feature_names_in_)
print("That's how many features:", len(feature_names))
assert raw_vector.size == len(feature_names), "Feature count mismatch"

# Apply the same transformation used during training.
X = pd.DataFrame([np.log1p(raw_vector)], columns=feature_names)

if __name__ == "__main__":
    print("Predicted label:", model.predict(X)[0])
    print("Probabilities", model.predict_proba(X)[0])