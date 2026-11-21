import joblib
import numpy as np
import pandas as pd

model = joblib.load("artifacts/guardroid_model.joblib")

def generate_raw_vector(size: int):
    return np.random.default_rng().integers(0, 10, size=size)

raw_vector = generate_raw_vector(68)

feature_names = list(model.feature_names_in_)
print("That's how many features:", len(feature_names))
assert raw_vector.size == len(feature_names), "Feature count mismatch"

# Apply the same transformation used during training.
X = pd.DataFrame([np.log1p(raw_vector)], columns=feature_names)