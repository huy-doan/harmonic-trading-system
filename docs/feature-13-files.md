# Feature 13: Machine Learning (Optional)

## Mô tả
Feature này triển khai các mô hình Machine Learning để cải thiện độ chính xác của việc phát hiện mô hình và dự đoán giá. Đây là tính năng nâng cao có thể phát triển sau khi hoàn thành các tính năng cốt lõi.

## Danh sách file cần triển khai

### Machine Learning Models
```
155. src/machine-learning/models/harmonic-classifier.model.ts  # Mô hình phân loại harmonic
156. src/machine-learning/models/price-predictor.model.ts      # Mô hình dự đoán giá
```

### DTOs
```
157. src/machine-learning/dtos/ml-prediction.dto.ts           # DTO dự đoán ML
```

### Services
```
158. src/machine-learning/services/ml-trainer.service.ts      # Service huấn luyện mô hình
159. src/machine-learning/services/ml-predictor.service.ts    # Service dự đoán
```

### Controllers & Module
```
160. src/machine-learning/controllers/ml.controller.ts        # Controller Machine Learning
161. src/machine-learning/machine-learning.module.ts          # Module Machine Learning
```

## Chi tiết triển khai

### harmonic-classifier.model.ts
Mô hình phân loại các mô hình Harmonic, giúp:
- Phân loại các mô hình tiềm năng có độ chính xác cao
- Xác định xác suất thành công của mô hình
- Cải thiện việc phát hiện mô hình giả

### price-predictor.model.ts
Mô hình dự đoán giá sau khi phát hiện mô hình, giúp:
- Dự đoán xu hướng giá sau khi hoàn thành mô hình
- Xác định mục tiêu giá tiềm năng
- Ước tính thời gian đến mục tiêu

### ml-trainer.service.ts
Service quản lý việc huấn luyện các mô hình ML:
- Thu thập và tiền xử lý dữ liệu training
- Thực hiện quá trình huấn luyện
- Đánh giá hiệu suất mô hình
- Lưu trữ và quản lý các phiên bản mô hình

### ml-predictor.service.ts
Service thực hiện dự đoán sử dụng các mô hình đã huấn luyện:
- Chuẩn bị dữ liệu đầu vào
- Thực hiện dự đoán
- Đánh giá độ tin cậy của dự đoán
- Tích hợp kết quả dự đoán vào hệ thống giao dịch

## Thứ tự triển khai đề xuất

1. Thu thập và chuẩn bị dữ liệu huấn luyện
2. Triển khai các mô hình ML cơ bản
3. Xây dựng ml-trainer.service.ts
4. Triển khai ml-predictor.service.ts
5. Tạo API endpoints và tích hợp vào hệ thống

## Phụ thuộc chính

- TensorFlow.js hoặc ML5.js
- Brain.js (cho neural networks đơn giản)
- NestJS
- TypeORM (để lưu trữ kết quả)

## Lưu ý triển khai

- Đây là một tính năng nâng cao, nên triển khai sau khi các tính năng cốt lõi đã hoạt động ổn định
- Cần thu thập đủ dữ liệu lịch sử và kết quả giao dịch để huấn luyện mô hình hiệu quả
- Có thể sử dụng các dịch vụ ML-as-a-Service thay vì tự xây dựng từ đầu