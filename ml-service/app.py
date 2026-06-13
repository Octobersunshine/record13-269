import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.text_classifier import (
    save_uploaded_file,
    get_dataset_preview,
    list_datasets,
    start_training,
    get_training_status,
    get_model_metrics,
    list_models,
    predict_text,
    predict_batch
)

app = Flask(__name__)
CORS(app)

ML_SERVICE_PORT = int(os.environ.get('ML_SERVICE_PORT', 5001))


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'text-classifier-ml'})


@app.route('/api/datasets', methods=['GET'])
def api_list_datasets():
    try:
        datasets = list_datasets()
        return jsonify({'success': True, 'datasets': datasets})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/upload', methods=['POST'])
def api_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        result = save_uploaded_file(file, file.filename)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/datasets/<dataset_id>/preview', methods=['GET'])
def api_dataset_preview(dataset_id):
    try:
        preview = get_dataset_preview(dataset_id)
        return jsonify({'success': True, **preview})
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/train', methods=['POST'])
def api_train():
    try:
        config = request.get_json()
        if not config or 'datasetId' not in config:
            return jsonify({'success': False, 'error': 'Missing datasetId'}), 400
        
        result = start_training(config)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/train/<model_id>/status', methods=['GET'])
def api_train_status(model_id):
    try:
        status = get_training_status(model_id)
        return jsonify({'success': True, **status})
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/models', methods=['GET'])
def api_list_models():
    try:
        models = list_models()
        return jsonify({'success': True, 'models': models})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/models/<model_id>/metrics', methods=['GET'])
def api_model_metrics(model_id):
    try:
        metrics = get_model_metrics(model_id)
        return jsonify({'success': True, **metrics})
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def api_predict():
    try:
        data = request.get_json()
        if not data or 'modelId' not in data or 'text' not in data:
            return jsonify({'success': False, 'error': 'Missing modelId or text'}), 400
        
        result = predict_text(data['modelId'], data['text'])
        return jsonify(result)
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/predict/batch', methods=['POST'])
def api_predict_batch():
    try:
        data = request.get_json()
        if not data or 'modelId' not in data or 'texts' not in data:
            return jsonify({'success': False, 'error': 'Missing modelId or texts'}), 400
        
        result = predict_batch(data['modelId'], data['texts'])
        return jsonify(result)
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=ML_SERVICE_PORT, debug=False)
