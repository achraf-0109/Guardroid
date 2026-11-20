from pathlib import Path
from tempfile import TemporaryDirectory
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from config import ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE
from services.predictor import predict_apk
from services.processor import process_features
from demo.demo import generate_raw_vector

router = APIRouter()

@router.get("/")
def health():
    return {"status": "ready"}

@router.post("/predict")
def predict(request: Request, file: UploadFile = File(...)):
    extension = Path(file.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Please upload an APK file.",
        )

    try:
        with TemporaryDirectory() as temp_dir:
            apk_path = Path(temp_dir) / "upload.apk"
            size = 0

            with apk_path.open("wb") as destination:
                while chunk := file.file.read(1024 * 1024):
                    size += len(chunk)

                    if size > MAX_UPLOAD_SIZE:
                        raise HTTPException(
                            status_code=413,
                            detail="APK exceeds the upload size limit.",
                        )

                    destination.write(chunk)

            if size == 0:
                raise HTTPException(
                    status_code=400,
                    detail="The uploaded file is empty.",
                )

            return predict_apk(
                apk_path=apk_path,
                model=request.app.state.model,
                feature_names=request.app.state.features,
            )
    finally:
        file.file.close()

@router.post("/predict_demo")
@router.post("/predict/demo")
def predict_demo(request: Request, file: UploadFile = File(...)): # file: UploadFile = File(...)
    filename = file.filename or ""
    if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Please upload an APK file.")

    if file.size == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if file.size is not None and file.size > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="APK exceeds the upload size limit.")

    model = request.app.state.model
    feature_names = list(model.feature_names_in_)

    raw_vector = generate_raw_vector(len(feature_names))

    print("That's the generated vect:", raw_vector)

    if raw_vector.shape != (len(feature_names),):
        raise RuntimeError("The demo vector must contain one value per model feature.")

    raw_features = {
        name: int(value)
        for name, value in zip(feature_names, raw_vector)
    }

    X = process_features(raw_features, feature_names)
    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]

    return {
        "mode": "demo",
        "filename": "demo file",
        "label": "Malicious" if not prediction.item() else "Benign"
    }
