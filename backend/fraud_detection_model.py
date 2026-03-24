import os
import pandas as pd
import numpy as np
import os
import json
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.svm import OneClassSVM
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import warnings
warnings.filterwarnings('ignore')

# Optional XGBoost
try:
    from xgboost import XGBClassifier
    _HAS_XGBOOST = True
except Exception:
    _HAS_XGBOOST = False

# TensorFlow for Autoencoder and CNN
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, Conv2D, MaxPooling2D, Flatten, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# -----------------------------
# Data generation
# -----------------------------

def generate_sample_data(n_samples=10000):
    np.random.seed(42)

    ages = np.random.normal(45, 15, n_samples).clip(18, 80)
    claim_amounts = np.random.exponential(5000, n_samples).clip(100, 100000)
    policy_types = np.random.choice(['Auto', 'Health', 'Property', 'Life'], n_samples)
    incident_types = np.random.choice(['Accident', 'Theft', 'Medical', 'Damage'], n_samples)
    claim_history = np.random.poisson(1, n_samples)
    policy_duration = np.random.uniform(1, 20, n_samples)
    deductible = np.random.choice([0, 500, 1000, 2000], n_samples)

    fraud_prob = (
        (claim_amounts > 20000) * 0.3 +
        (ages < 25) * 0.2 +
        (claim_history > 3) * 0.25 +
        (policy_duration < 2) * 0.15 +
        np.random.random(n_samples) * 0.1
    ).clip(0, 1)

    is_fraud = (np.random.random(n_samples) < fraud_prob).astype(int)

    claim_amounts = claim_amounts * (1 + is_fraud * np.random.normal(0.5, 0.2, n_samples))

    df = pd.DataFrame({
        'age': ages.astype(int),
        'claim_amount': claim_amounts,
        'policy_type': policy_types,
        'incident_type': incident_types,
        'claim_history': claim_history,
        'policy_duration': policy_duration,
        'deductible': deductible,
        'is_fraud': is_fraud
    })

    return df


def load_real_fraud_data():
    try:
        df = pd.read_excel('Fraud data FY 2023-24 for B&CC.xlsx')
        print(f"Loaded real fraud dataset with {len(df)} records")

        fraud_df = pd.DataFrame({
            'age': df['ASSURED_AGE'].fillna(45).astype(int),
            'claim_amount': df['POLICY SUMASSURED'].fillna(50000),
            'policy_type': df['Product Type'].fillna('Life').map({
                'Term Life': 'Life',
                'Whole Life': 'Life',
                'ULIP': 'Life',
                'Endowment': 'Life',
                'Money Back': 'Life',
                'Health': 'Health',
                'Critical Illness': 'Health',
                'Personal Accident': 'Auto',
                'Home': 'Property',
                'Motor': 'Auto'
            }).fillna('Life'),
            'incident_type': 'Death',
            'claim_history': 1,
            'policy_duration': df['Policy Term'].fillna(10),
            'deductible': 0,
            'is_fraud': 1
        })

        return fraud_df
    except FileNotFoundError:
        print("Real fraud dataset not found, using synthetic data only")
        return None


def generate_combined_data(n_normal=8000, n_fraud=None):
    normal_df = generate_sample_data(n_normal)
    normal_df = normal_df[normal_df['is_fraud'] == 0]

    fraud_df = load_real_fraud_data()

    if fraud_df is not None and n_fraud is not None:
        fraud_df = fraud_df.sample(min(n_fraud, len(fraud_df)), random_state=42)
        combined_df = pd.concat([normal_df, fraud_df], ignore_index=True)
    else:
        combined_df = normal_df

    return combined_df


# -----------------------------
# Preprocessing
# -----------------------------

def preprocess_data(df, scaler=None, le_policy=None, le_incident=None, fit=True):
    if fit:
        le_policy = LabelEncoder()
        le_incident = LabelEncoder()
        df['policy_type_encoded'] = le_policy.fit_transform(df['policy_type'])
        df['incident_type_encoded'] = le_incident.fit_transform(df['incident_type'])
    else:
        df['policy_type_encoded'] = le_policy.transform(df['policy_type'])
        df['incident_type_encoded'] = le_incident.transform(df['incident_type'])

    features = [
        'age',
        'claim_amount',
        'policy_type_encoded',
        'incident_type_encoded',
        'claim_history',
        'policy_duration',
        'deductible'
    ]

    X = df[features]
    y = df['is_fraud'] if 'is_fraud' in df.columns else None

    if fit:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    else:
        X_scaled = scaler.transform(X)

    return X_scaled, y, scaler, le_policy, le_incident


# -----------------------------
# Autoencoder for anomaly detection
# -----------------------------

def build_autoencoder(input_dim, encoding_dim=4):
    input_layer = Input(shape=(input_dim,))
    encoded = Dense(encoding_dim, activation='relu')(input_layer)
    decoded = Dense(input_dim, activation='sigmoid')(encoded)

    autoencoder = Model(input_layer, decoded)
    autoencoder.compile(optimizer=Adam(learning_rate=0.001), loss='mse')

    return autoencoder


def train_autoencoder():
    print("Training Autoencoder for anomaly detection...")
    df = generate_combined_data(n_normal=8000, n_fraud=1000)

    X, y, scaler, le_policy, le_incident = preprocess_data(df, fit=True)

    X_normal = X[y == 0]

    print(f"Training on {len(X_normal)} normal samples")

    autoencoder = build_autoencoder(X.shape[1])
    autoencoder.fit(X_normal, X_normal, epochs=50, batch_size=32, validation_split=0.1, verbose=0)

    reconstructions = autoencoder.predict(X_normal)
    mse = np.mean(np.power(X_normal - reconstructions, 2), axis=1)
    threshold = np.percentile(mse, 95)

    print(f"Anomaly detection threshold: {threshold:.4f}")

    autoencoder.save('autoencoder_model.keras')
    joblib.dump(threshold, 'autoencoder_threshold.pkl')
    joblib.dump(scaler, 'scaler_ae.pkl')
    joblib.dump(le_policy, 'label_encoder_policy_ae.pkl')
    joblib.dump(le_incident, 'label_encoder_incident_ae.pkl')

    print("Autoencoder saved successfully!")

    return autoencoder, threshold, scaler, le_policy, le_incident


def predict_anomaly(age, claim_amount, policy_type, incident_type,
                    claim_history, policy_duration, deductible):
    try:
        autoencoder = tf.keras.models.load_model('autoencoder_model.keras')
        threshold = joblib.load('autoencoder_threshold.pkl')
        scaler = joblib.load('scaler_ae.pkl')
        le_policy = joblib.load('label_encoder_policy_ae.pkl')
        le_incident = joblib.load('label_encoder_incident_ae.pkl')
    except Exception:
        print("Autoencoder model files not found. Please train the autoencoder first.")
        return None

    policy_encoded = le_policy.transform([policy_type])[0]
    incident_encoded = le_incident.transform([incident_type])[0]

    features = np.array([[age, claim_amount, policy_encoded, incident_encoded,
                         claim_history, policy_duration, deductible]])

    features_scaled = scaler.transform(features)

    reconstruction = autoencoder.predict(features_scaled)
    mse = np.mean(np.power(features_scaled - reconstruction, 2), axis=1)[0]

    is_anomaly = mse > threshold

    return {
        'is_anomaly': bool(is_anomaly),
        'reconstruction_error': float(mse),
        'threshold': float(threshold),
        'anomaly_score': float(mse / threshold) if threshold > 0 else 0
    }


# -----------------------------
# Supervised models
# -----------------------------

def train_supervised_models():
    print("Generating combined insurance fraud dataset...")
    df = generate_combined_data(n_normal=8000, n_fraud=1000)

    print(f"Dataset shape: {df.shape}")
    print(f"Fraud cases: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.1f}%)")

    X, y, scaler, le_policy, le_incident = preprocess_data(df, fit=True)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models = {}

    print("Training Random Forest model...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        class_weight='balanced'
    )
    rf_model.fit(X_train, y_train)
    models['random_forest'] = rf_model

    print("Training Logistic Regression model...")
    lr_model = LogisticRegression(max_iter=1000, class_weight='balanced')
    lr_model.fit(X_train, y_train)
    models['logistic_regression'] = lr_model

    if _HAS_XGBOOST:
        print("Training XGBoost model...")
        xgb_model = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective='binary:logistic',
            eval_metric='auc',
            random_state=42
        )
        xgb_model.fit(X_train, y_train)
        models['xgboost'] = xgb_model
    else:
        print("XGBoost not available. Install xgboost to enable it.")

    print("\nModel Performance:")
    aucs = {}
    for name, model in models.items():
        y_pred = model.predict(X_test)
        if hasattr(model, 'predict_proba'):
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            auc = roc_auc_score(y_test, y_pred_proba)
        else:
            auc = 0.0
        aucs[name] = float(auc)
        print(f"{name}: AUC-ROC {auc:.3f}")

    print("\nSaving supervised models...")
    joblib.dump(rf_model, 'fraud_detection_model.pkl')
    joblib.dump(lr_model, 'logistic_fraud_model.pkl')
    if 'xgboost' in models:
        joblib.dump(models['xgboost'], 'xgboost_fraud_model.pkl')

    joblib.dump(scaler, 'scaler.pkl')
    joblib.dump(le_policy, 'label_encoder_policy.pkl')
    joblib.dump(le_incident, 'label_encoder_incident.pkl')

    print("Supervised models saved successfully!")

    return models, scaler, le_policy, le_incident, aucs


def predict_fraud(age, claim_amount, policy_type, incident_type,
                  claim_history, policy_duration, deductible):
    try:
        model = joblib.load('fraud_detection_model.pkl')
        scaler = joblib.load('scaler.pkl')
        le_policy = joblib.load('label_encoder_policy.pkl')
        le_incident = joblib.load('label_encoder_incident.pkl')
    except FileNotFoundError:
        print("Model files not found. Please train the model first.")
        return None

    policy_encoded = le_policy.transform([policy_type])[0]
    incident_encoded = le_incident.transform([incident_type])[0]

    features = np.array([[age, claim_amount, policy_encoded, incident_encoded,
                         claim_history, policy_duration, deductible]])

    features_scaled = scaler.transform(features)

    fraud_probability = model.predict_proba(features_scaled)[0][1]
    is_fraud = model.predict(features_scaled)[0]

    return {
        'is_fraud': bool(is_fraud),
        'fraud_probability': float(fraud_probability),
        'risk_score': int(fraud_probability * 100)
    }


# -----------------------------
# Anomaly models (Isolation Forest, One-Class SVM, Autoencoder)
# -----------------------------

def train_anomaly_models():
    print("Training Isolation Forest and One-Class SVM...")
    df = generate_combined_data(n_normal=8000, n_fraud=1000)

    X, y, scaler, le_policy, le_incident = preprocess_data(df, fit=True)
    X_normal = X[y == 0]

    iso_model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42
    )
    iso_model.fit(X_normal)

    ocs_model = OneClassSVM(
        nu=0.05,
        kernel='rbf',
        gamma='scale'
    )
    ocs_model.fit(X_normal)

    joblib.dump(iso_model, 'isolation_forest_model.pkl')
    joblib.dump(ocs_model, 'one_class_svm_model.pkl')
    joblib.dump(scaler, 'scaler_anomaly.pkl')
    joblib.dump(le_policy, 'label_encoder_policy_anomaly.pkl')
    joblib.dump(le_incident, 'label_encoder_incident_anomaly.pkl')

    print("Isolation Forest and One-Class SVM saved successfully!")

    # Autoencoder uses its own scaler and encoders
    _, ae_threshold, _, _, _ = train_autoencoder()

    return iso_model, ocs_model, float(ae_threshold)


def predict_anomaly_all(age, claim_amount, policy_type, incident_type,
                        claim_history, policy_duration, deductible):
    results = {}

    # Isolation Forest and One-Class SVM
    try:
        iso_model = joblib.load('isolation_forest_model.pkl')
        ocs_model = joblib.load('one_class_svm_model.pkl')
        scaler = joblib.load('scaler_anomaly.pkl')
        le_policy = joblib.load('label_encoder_policy_anomaly.pkl')
        le_incident = joblib.load('label_encoder_incident_anomaly.pkl')

        policy_encoded = le_policy.transform([policy_type])[0]
        incident_encoded = le_incident.transform([incident_type])[0]

        features = np.array([[age, claim_amount, policy_encoded, incident_encoded,
                             claim_history, policy_duration, deductible]])

        features_scaled = scaler.transform(features)

        iso_score = -iso_model.decision_function(features_scaled)[0]
        ocs_score = -ocs_model.decision_function(features_scaled)[0]

        results['isolation_forest'] = float(iso_score)
        results['one_class_svm'] = float(ocs_score)
    except Exception:
        results['isolation_forest'] = None
        results['one_class_svm'] = None

    # Autoencoder
    ae_result = predict_anomaly(
        age=age,
        claim_amount=claim_amount,
        policy_type=policy_type,
        incident_type=incident_type,
        claim_history=claim_history,
        policy_duration=policy_duration,
        deductible=deductible
    )
    results['autoencoder'] = ae_result

    return results


# -----------------------------
# Ensemble prediction
# -----------------------------

def predict_fraud_ensemble(age, claim_amount, policy_type, incident_type,
                           claim_history, policy_duration, deductible):
    try:
        scaler = joblib.load('scaler.pkl')
        le_policy = joblib.load('label_encoder_policy.pkl')
        le_incident = joblib.load('label_encoder_incident.pkl')
        rf_model = joblib.load('fraud_detection_model.pkl')
        lr_model = joblib.load('logistic_fraud_model.pkl')
        xgb_model = None
        if os.path.exists('xgboost_fraud_model.pkl'):
            xgb_model = joblib.load('xgboost_fraud_model.pkl')
    except Exception:
        print("Supervised model files not found. Please train the models first.")
        return None

    policy_encoded = le_policy.transform([policy_type])[0]
    incident_encoded = le_incident.transform([incident_type])[0]

    features = np.array([[age, claim_amount, policy_encoded, incident_encoded,
                         claim_history, policy_duration, deductible]])

    features_scaled = scaler.transform(features)

    probs = {}
    probs['random_forest'] = float(rf_model.predict_proba(features_scaled)[0][1])
    probs['logistic_regression'] = float(lr_model.predict_proba(features_scaled)[0][1])
    if xgb_model is not None:
        probs['xgboost'] = float(xgb_model.predict_proba(features_scaled)[0][1])

    supervised_avg = float(np.mean(list(probs.values())))

    anomaly_results = predict_anomaly_all(
        age=age,
        claim_amount=claim_amount,
        policy_type=policy_type,
        incident_type=incident_type,
        claim_history=claim_history,
        policy_duration=policy_duration,
        deductible=deductible
    )

    anomaly_score = 0.0
    anomaly_count = 0
    if anomaly_results.get('isolation_forest') is not None:
        anomaly_score += anomaly_results['isolation_forest']
        anomaly_count += 1
    if anomaly_results.get('one_class_svm') is not None:
        anomaly_score += anomaly_results['one_class_svm']
        anomaly_count += 1
    if anomaly_results.get('autoencoder') is not None:
        anomaly_score += anomaly_results['autoencoder']['anomaly_score']
        anomaly_count += 1

    if anomaly_count > 0:
        anomaly_avg = anomaly_score / anomaly_count
    else:
        anomaly_avg = 0.0

    # Normalize anomaly signal to 0-1 (soft clamp)
    anomaly_norm = float(1 - np.exp(-max(anomaly_avg, 0)))

    combined_score = 0.7 * supervised_avg + 0.3 * anomaly_norm
    is_fraud = combined_score >= 0.5

    return {
        'is_fraud': bool(is_fraud),
        'fraud_probability': float(combined_score),
        'risk_score': int(combined_score * 100),
        'supervised_models': probs,
        'anomaly_models': anomaly_results
    }


# -----------------------------
# NLP model (TF-IDF + Logistic Regression)
# -----------------------------

def generate_sample_text_data(n_samples=2000):
    np.random.seed(42)
    fraud_templates = [
        "claim for accident but no police report",
        "multiple claims in short time",
        "injury description inconsistent",
        "repeated hospital visits for same issue",
        "suspicious repair invoices"
    ]
    legit_templates = [
        "minor accident with police report",
        "routine medical claim",
        "single claim with proper documentation",
        "vehicle damage reported on time",
        "verified hospital discharge summary"
    ]

    texts = []
    labels = []
    for _ in range(n_samples):
        if np.random.rand() < 0.3:
            texts.append(np.random.choice(fraud_templates))
            labels.append(1)
        else:
            texts.append(np.random.choice(legit_templates))
            labels.append(0)

    return texts, np.array(labels)


def train_text_model(texts=None, labels=None):
    if texts is None or labels is None:
        texts, labels = generate_sample_text_data()

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    model = LogisticRegression(max_iter=1000, class_weight='balanced')
    model.fit(X_train_vec, y_train)

    y_pred_proba = model.predict_proba(X_test_vec)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"Text model AUC-ROC: {auc:.3f}")

    joblib.dump(model, 'text_fraud_model.pkl')
    joblib.dump(vectorizer, 'text_vectorizer.pkl')

    print("Text model saved successfully!")

    return model, vectorizer, float(auc)


# -----------------------------
# Status writer
# -----------------------------

def write_model_status(status, path=None):
    status = dict(status or {})
    status['updated_at'] = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    if path is None:
        path = os.path.join(os.path.dirname(__file__), 'model_status.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(status, f, indent=2)


def predict_text_fraud(text):
    try:
        model = joblib.load('text_fraud_model.pkl')
        vectorizer = joblib.load('text_vectorizer.pkl')
    except Exception:
        print("Text model files not found. Please train the text model first.")
        return None

    X_vec = vectorizer.transform([text])
    prob = float(model.predict_proba(X_vec)[0][1])
    is_fraud = prob >= 0.5

    return {
        'is_fraud': bool(is_fraud),
        'fraud_probability': prob,
        'risk_score': int(prob * 100)
    }


# -----------------------------
# Document verification (OpenCV + optional CNN)
# -----------------------------

def build_document_cnn(input_shape=(128, 128, 3)):
    model = tf.keras.Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        MaxPooling2D(2, 2),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        Flatten(),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dense(1, activation='sigmoid')
    ])

    model.compile(optimizer=Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy'])

    return model


def train_document_cnn(data_dir='document_data'):
    if not os.path.isdir(data_dir):
        print(f"Document data directory not found: {data_dir}")
        return None

    datagen = ImageDataGenerator(rescale=1.0 / 255, validation_split=0.2)

    train_gen = datagen.flow_from_directory(
        data_dir,
        target_size=(128, 128),
        batch_size=32,
        class_mode='binary',
        subset='training'
    )

    val_gen = datagen.flow_from_directory(
        data_dir,
        target_size=(128, 128),
        batch_size=32,
        class_mode='binary',
        subset='validation'
    )

    model = build_document_cnn()
    model.fit(train_gen, validation_data=val_gen, epochs=10)

    model.save('document_cnn_model.keras')
    print("Document CNN saved successfully!")

    return model


def _template_similarity(image_path, reference_path):
    try:
        import cv2
    except Exception:
        print("OpenCV not installed. Install opencv-python to enable template matching.")
        return None

    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    ref = cv2.imread(reference_path, cv2.IMREAD_GRAYSCALE)

    if img is None or ref is None:
        return None

    img = cv2.resize(img, (600, 800))
    ref = cv2.resize(ref, (600, 800))

    result = cv2.matchTemplate(img, ref, cv2.TM_CCOEFF_NORMED)
    similarity = float(result.max())

    return similarity


def _cnn_document_score(image_path):
    if not os.path.exists('document_cnn_model.keras'):
        return None

    img = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))
    arr = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)

    model = tf.keras.models.load_model('document_cnn_model.keras')
    prob = float(model.predict(arr)[0][0])

    return prob


def verify_document(image_path, reference_path=None):
    cnn_score = _cnn_document_score(image_path)
    template_score = None
    if reference_path:
        template_score = _template_similarity(image_path, reference_path)

    result = {
        'cnn_score': cnn_score,
        'template_similarity': template_score
    }

    if cnn_score is not None:
        result['is_fraud'] = cnn_score >= 0.5
        result['risk_score'] = int(cnn_score * 100)
    elif template_score is not None:
        result['is_fraud'] = template_score < 0.8
        result['risk_score'] = int((1 - template_score) * 100)
    else:
        result['is_fraud'] = None
        result['risk_score'] = None

    return result


# -----------------------------
# Main training entrypoint
# -----------------------------

if __name__ == "__main__":
    models, scaler, le_policy, le_incident, aucs = train_supervised_models()
    iso_model, ocs_model, ae_threshold = train_anomaly_models()
    text_model, vectorizer, text_auc = train_text_model()
    # Optional: train_document_cnn('document_data')

    print("\nExample Supervised Prediction:")
    result = predict_fraud(
        age=25,
        claim_amount=25000,
        policy_type='Auto',
        incident_type='Accident',
        claim_history=4,
        policy_duration=1.5,
        deductible=500
    )

    if result:
        print(f"Fraud Prediction: {result['is_fraud']}")
        print(f"Fraud Probability: {result['fraud_probability']:.3f}")
        print(f"Risk Score: {result['risk_score']}")

    print("\nExample Ensemble Prediction:")
    ensemble_result = predict_fraud_ensemble(
        age=25,
        claim_amount=25000,
        policy_type='Auto',
        incident_type='Accident',
        claim_history=4,
        policy_duration=1.5,
        deductible=500
    )

    if ensemble_result:
        print(f"Ensemble Fraud: {ensemble_result['is_fraud']}")
        print(f"Ensemble Risk Score: {ensemble_result['risk_score']}")

    print("\nExample Anomaly Detection:")
    anomaly_result = predict_anomaly(
        age=25,
        claim_amount=25000,
        policy_type='Auto',
        incident_type='Accident',
        claim_history=4,
        policy_duration=1.5,
        deductible=500
    )

    if anomaly_result:
        print(f"Is Anomaly: {anomaly_result['is_anomaly']}")
        print(f"Reconstruction Error: {anomaly_result['reconstruction_error']:.4f}")
        print(f"Anomaly Score: {anomaly_result['anomaly_score']:.2f}")

    print("\nExample Text Fraud Prediction:")
    text_result = predict_text_fraud("claim for accident but no police report")
    if text_result:
        print(f"Text Fraud: {text_result['is_fraud']}")
        print(f"Text Risk Score: {text_result['risk_score']}")

    # Write status file for live frontend updates
    best_auc = max(aucs.values()) if aucs else 0.0
    status = {
        'version': 'v2.4',
        'status': 'All Systems Operational',
        'accuracy': round(best_auc * 100, 2),
        'metrics': {
            'supervised_auc': aucs,
            'text_auc': text_auc,
            'autoencoder_threshold': ae_threshold
        },
        'models': {
            'random_forest': os.path.exists('fraud_detection_model.pkl'),
            'logistic_regression': os.path.exists('logistic_fraud_model.pkl'),
            'xgboost': os.path.exists('xgboost_fraud_model.pkl'),
            'isolation_forest': os.path.exists('isolation_forest_model.pkl'),
            'one_class_svm': os.path.exists('one_class_svm_model.pkl'),
            'autoencoder': os.path.exists('autoencoder_model.keras'),
            'text_model': os.path.exists('text_fraud_model.pkl')
        }
    }
    write_model_status(status)

    print("\nTo use these models in your backend:")
    print("1. Run this script to train and save all models")
    print("2. Import prediction functions in your FastAPI app")
