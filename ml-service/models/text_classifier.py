import os
import json
import uuid
import time
import threading
from typing import Dict, List, Tuple, Any
import pandas as pd
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.naive_bayes import MultinomialNB, BernoulliNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'ml-service', 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'ml-service', 'saved_models')
META_DIR = os.path.join(BASE_DIR, 'ml-service', 'metadata')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(META_DIR, exist_ok=True)

_training_tasks: Dict[str, Dict[str, Any]] = {}
_lock = threading.Lock()


def save_uploaded_file(file_storage, filename: str) -> Dict[str, Any]:
    dataset_id = str(uuid.uuid4())
    file_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
    file_storage.save(file_path)
    
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        os.remove(file_path)
        raise ValueError(f"Failed to read CSV file: {str(e)}")
    
    if 'text' not in df.columns or 'label' not in df.columns:
        os.remove(file_path)
        raise ValueError("CSV must contain 'text' and 'label' columns")
    
    row_count = len(df)
    columns = df.columns.tolist()
    sample_data = df[['text', 'label']].head(10).to_dict('records')
    
    meta = {
        'id': dataset_id,
        'filename': filename,
        'filePath': file_path,
        'rowCount': row_count,
        'columns': columns,
        'createdAt': time.time()
    }
    
    meta_path = os.path.join(META_DIR, f"{dataset_id}_dataset.json")
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False)
    
    return {
        'success': True,
        'datasetId': dataset_id,
        'filename': filename,
        'rowCount': row_count,
        'columns': columns,
        'sample': sample_data
    }


def get_dataset_preview(dataset_id: str) -> Dict[str, Any]:
    meta_path = os.path.join(META_DIR, f"{dataset_id}_dataset.json")
    if not os.path.exists(meta_path):
        raise ValueError("Dataset not found")
    
    with open(meta_path, 'r', encoding='utf-8') as f:
        meta = json.load(f)
    
    file_path = meta['filePath']
    df = pd.read_csv(file_path)
    sample_data = df[['text', 'label']].head(20).to_dict('records')
    
    label_dist = df['label'].value_counts().to_dict()
    
    return {
        'datasetId': dataset_id,
        'filename': meta['filename'],
        'rowCount': meta['rowCount'],
        'columns': meta['columns'],
        'sample': sample_data,
        'labelDistribution': label_dist
    }


def list_datasets() -> List[Dict[str, Any]]:
    datasets = []
    for filename in os.listdir(META_DIR):
        if filename.endswith('_dataset.json'):
            with open(os.path.join(META_DIR, filename), 'r', encoding='utf-8') as f:
                datasets.append(json.load(f))
    return sorted(datasets, key=lambda x: x.get('createdAt', 0), reverse=True)


def start_training(config: Dict[str, Any]) -> Dict[str, Any]:
    dataset_id = config['datasetId']
    feature_type = config.get('featureType', 'tfidf')
    classifier_type = config.get('classifierType', 'multinomial')
    test_size = config.get('testSize', 0.2)
    random_state = config.get('randomState', 42)
    
    meta_path = os.path.join(META_DIR, f"{dataset_id}_dataset.json")
    if not os.path.exists(meta_path):
        raise ValueError("Dataset not found")
    
    with open(meta_path, 'r', encoding='utf-8') as f:
        meta = json.load(f)
    
    model_id = str(uuid.uuid4())
    
    model_meta = {
        'id': model_id,
        'datasetId': dataset_id,
        'featureType': feature_type,
        'classifierType': classifier_type,
        'testSize': test_size,
        'randomState': random_state,
        'status': 'training',
        'progress': 0,
        'createdAt': time.time()
    }
    
    model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
    with open(model_meta_path, 'w', encoding='utf-8') as f:
        json.dump(model_meta, f, ensure_ascii=False)
    
    with _lock:
        _training_tasks[model_id] = {**model_meta, 'thread': None}
    
    thread = threading.Thread(
        target=_train_model,
        args=(model_id, meta['filePath'], feature_type, classifier_type, test_size, random_state)
    )
    thread.daemon = True
    thread.start()
    
    with _lock:
        _training_tasks[model_id]['thread'] = thread
    
    return {
        'success': True,
        'modelId': model_id,
        'status': 'training'
    }


def _train_model(model_id: str, data_path: str, feature_type: str, classifier_type: str, test_size: float, random_state: int):
    try:
        _update_training_progress(model_id, 10)
        df = pd.read_csv(data_path)
        texts = df['text'].fillna('').astype(str).tolist()
        labels = df['label'].tolist()
        
        _update_training_progress(model_id, 20)
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=test_size, random_state=random_state, stratify=labels)
        
        _update_training_progress(model_id, 35)
        if feature_type == 'tfidf':
            vectorizer = TfidfVectorizer(max_features=5000)
        else:
            vectorizer = CountVectorizer(max_features=5000)
        
        X_train_vec = vectorizer.fit_transform(X_train)
        X_test_vec = vectorizer.transform(X_test)
        
        _update_training_progress(model_id, 55)
        if classifier_type == 'multinomial':
            classifier = MultinomialNB()
        else:
            classifier = BernoulliNB()
        
        classifier.fit(X_train_vec, y_train)
        
        _update_training_progress(model_id, 75)
        y_pred = classifier.predict(X_test_vec)
        y_pred_proba = classifier.predict_proba(X_test_vec)
        
        _update_training_progress(model_id, 85)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        labels_list = sorted(classifier.classes_.tolist())
        cm = confusion_matrix(y_test, y_pred, labels=labels_list)
        
        _update_training_progress(model_id, 95)
        model_path = os.path.join(MODEL_DIR, f"{model_id}.joblib")
        vectorizer_path = os.path.join(MODEL_DIR, f"{model_id}-vectorizer.joblib")
        
        joblib.dump(classifier, model_path)
        joblib.dump(vectorizer, vectorizer_path)
        
        model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
        with open(model_meta_path, 'r', encoding='utf-8') as f:
            model_meta = json.load(f)
        
        model_meta.update({
            'status': 'completed',
            'progress': 100,
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1': float(f1),
            'confusionMatrix': cm.tolist(),
            'labels': labels_list,
            'modelPath': model_path,
            'vectorizerPath': vectorizer_path,
            'completedAt': time.time()
        })
        
        with open(model_meta_path, 'w', encoding='utf-8') as f:
            json.dump(model_meta, f, ensure_ascii=False)
        
        with _lock:
            if model_id in _training_tasks:
                _training_tasks[model_id].update(model_meta)
        
    except Exception as e:
        model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
        with open(model_meta_path, 'r', encoding='utf-8') as f:
            model_meta = json.load(f)
        model_meta.update({
            'status': 'failed',
            'error': str(e),
            'completedAt': time.time()
        })
        with open(model_meta_path, 'w', encoding='utf-8') as f:
            json.dump(model_meta, f, ensure_ascii=False)
        
        with _lock:
            if model_id in _training_tasks:
                _training_tasks[model_id].update(model_meta)


def _update_training_progress(model_id: str, progress: int):
    model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
    with open(model_meta_path, 'r', encoding='utf-8') as f:
        model_meta = json.load(f)
    model_meta['progress'] = progress
    with open(model_meta_path, 'w', encoding='utf-8') as f:
        json.dump(model_meta, f, ensure_ascii=False)
    
    with _lock:
        if model_id in _training_tasks:
            _training_tasks[model_id]['progress'] = progress


def get_training_status(model_id: str) -> Dict[str, Any]:
    with _lock:
        if model_id in _training_tasks:
            task = _training_tasks[model_id]
            return {
                'modelId': model_id,
                'status': task['status'],
                'progress': task.get('progress', 0)
            }
    
    model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
    if not os.path.exists(model_meta_path):
        raise ValueError("Model not found")
    
    with open(model_meta_path, 'r', encoding='utf-8') as f:
        model_meta = json.load(f)
    
    result = {
        'modelId': model_id,
        'status': model_meta['status'],
        'progress': model_meta.get('progress', 0)
    }
    
    if model_meta['status'] == 'completed':
        result['metrics'] = {
            'accuracy': model_meta.get('accuracy', 0),
            'precision': model_meta.get('precision', 0),
            'recall': model_meta.get('recall', 0),
            'f1': model_meta.get('f1', 0),
            'confusionMatrix': model_meta.get('confusionMatrix', []),
            'labels': model_meta.get('labels', [])
        }
    
    return result


def get_model_metrics(model_id: str) -> Dict[str, Any]:
    model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
    if not os.path.exists(model_meta_path):
        raise ValueError("Model not found")
    
    with open(model_meta_path, 'r', encoding='utf-8') as f:
        model_meta = json.load(f)
    
    if model_meta['status'] != 'completed':
        raise ValueError("Model training not completed")
    
    return {
        'modelId': model_id,
        'status': 'completed',
        'metrics': {
            'accuracy': model_meta.get('accuracy', 0),
            'precision': model_meta.get('precision', 0),
            'recall': model_meta.get('recall', 0),
            'f1': model_meta.get('f1', 0),
            'confusionMatrix': model_meta.get('confusionMatrix', []),
            'labels': model_meta.get('labels', [])
        }
    }


def list_models() -> List[Dict[str, Any]]:
    models = []
    for filename in os.listdir(META_DIR):
        if filename.endswith('_model.json'):
            with open(os.path.join(META_DIR, filename), 'r', encoding='utf-8') as f:
                meta = json.load(f)
            models.append({
                'id': meta['id'],
                'datasetId': meta['datasetId'],
                'status': meta['status'],
                'accuracy': meta.get('accuracy'),
                'createdAt': meta.get('createdAt')
            })
    return sorted(models, key=lambda x: x.get('createdAt', 0), reverse=True)


def predict_text(model_id: str, text: str) -> Dict[str, Any]:
    model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
    if not os.path.exists(model_meta_path):
        raise ValueError("Model not found")
    
    with open(model_meta_path, 'r', encoding='utf-8') as f:
        model_meta = json.load(f)
    
    if model_meta['status'] != 'completed':
        raise ValueError("Model training not completed")
    
    model_path = model_meta['modelPath']
    vectorizer_path = model_meta['vectorizerPath']
    
    classifier = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    
    text_vec = vectorizer.transform([text])
    prediction = classifier.predict(text_vec)[0]
    probabilities = classifier.predict_proba(text_vec)[0]
    
    labels = classifier.classes_.tolist()
    top_k = []
    for i, prob in sorted(enumerate(probabilities), key=lambda x: x[1], reverse=True):
        top_k.append({
            'label': labels[i],
            'probability': float(prob)
        })
    
    confidence = float(max(probabilities))
    
    return {
        'success': True,
        'predictedLabel': prediction,
        'confidence': confidence,
        'topK': top_k
    }


def predict_batch(model_id: str, texts: List[str]) -> Dict[str, Any]:
    model_meta_path = os.path.join(META_DIR, f"{model_id}_model.json")
    if not os.path.exists(model_meta_path):
        raise ValueError("Model not found")
    
    with open(model_meta_path, 'r', encoding='utf-8') as f:
        model_meta = json.load(f)
    
    if model_meta['status'] != 'completed':
        raise ValueError("Model training not completed")
    
    model_path = model_meta['modelPath']
    vectorizer_path = model_meta['vectorizerPath']
    
    classifier = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    
    texts_clean = [t if t else '' for t in texts]
    texts_vec = vectorizer.transform(texts_clean)
    predictions = classifier.predict(texts_vec)
    probabilities = classifier.predict_proba(texts_vec)
    
    labels = classifier.classes_.tolist()
    
    results = []
    for i, pred in enumerate(predictions):
        probs = probabilities[i]
        confidence = float(max(probs))
        top_k = []
        for j, prob in sorted(enumerate(probs), key=lambda x: x[1], reverse=True):
            top_k.append({
                'label': labels[j],
                'probability': float(prob)
            })
        results.append({
            'text': texts[i],
            'predictedLabel': pred,
            'confidence': confidence,
            'topK': top_k
        })
    
    return {
        'success': True,
        'predictions': results
    }
