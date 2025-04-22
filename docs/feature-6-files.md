# Feature 6: Market Data & Binance Integration

## Mô tả
Feature này cung cấp khả năng kết nối với Binance API để lấy dữ liệu thị trường và thực hiện các giao dịch.

## Danh sách file cần triển khai

### Binance API Integration
```
054. src/infrastructure/external/binance/binance.client.ts          # Client Binance REST API
055. src/infrastructure/external/binance/binance-websocket.client.ts # Client Binance WebSocket
056. src/infrastructure/external/binance/binance.adapter.ts         # Adapter cho Binance
057. src/infrastructure/external/binance/rate-limiter.ts            # Giới hạn số request
058. src/infrastructure/external/binance/market-data-stream.service.ts # Dịch vụ luồng dữ liệu
059. src/infrastructure/external/binance/trading-api.service.ts     # Service giao dịch qua API
060. src/infrastructure/external/binance/binance.types.ts           # Các type cho Binance API
```

### Binance Module
```
152. src/binances/binance.module.ts                                 # Module Binance
153. src/binances/binance.controller.ts                             # Controller Binance
154. src/binances/binance.service.ts                                # Service Binance
```

### Market Analysis Domain
```
134. src/domain/market-analysis/entities/market-data.entity.ts      # Entity dữ liệu thị trường
135. src/domain/market-analysis/dtos/market-data.dto.ts             # DTO dữ liệu thị trường
136. src/domain/market-analysis/services/market-analyzer.service.ts # Service phân tích thị trường
137. src/domain/market-analysis/services/trend-analyzer.service.ts  # Service phân tích xu hướng
138. src/domain/market-analysis/controllers/market.controller.ts    # Controller thị trường
139. src/domain/market-analysis/market-analysis.module.ts           # Module phân tích thị trường
```

### Market Analysis Task
```
165. src/tasks/market-analyzer.task.ts                              # Task phân tích thị trường
```

## Chi tiết triển khai

### binance.client.ts
Client để tương tác với Binance REST API, cung cấp các phương thức để:
- Lấy thông tin thị trường (giá cả, khối lượng)
- Lấy dữ liệu lịch sử (candles)
- Đặt và quản lý lệnh giao dịch
- Quản lý tài khoản

### binance-websocket.client.ts
Client để kết nối với Binance WebSocket API, cung cấp các phương thức để:
- Theo dõi dữ liệu thị trường theo thời gian thực
- Nhận thông báo về giao dịch và lệnh
- Theo dõi các cập nhật trạng thái tài khoản

### binance.adapter.ts
Adapter chuyển đổi dữ liệu từ Binance API sang định dạng sử dụng trong hệ thống:
- Chuyển đổi candle data thành định dạng chuẩn
- Chuẩn hóa thông tin giao dịch
- Xử lý lỗi và ngoại lệ từ Binance API

### rate-limiter.ts
Quản lý giới hạn request đến Binance API:
- Theo dõi số lượng request
- Thực hiện việc throttling nếu cần
- Xử lý các trường hợp vượt quá giới hạn

### market-data-stream.service.ts
Service quản lý luồng dữ liệu thị trường:
- Tổng hợp dữ liệu từ nhiều nguồn (REST và WebSocket)
- Lưu trữ và cập nhật dữ liệu trong cache
- Phân phối dữ liệu đến các service khác

### market-analyzer.service.ts
Service phân tích dữ liệu thị trường:
- Tính toán các chỉ số thị trường
- Phân tích xu hướng
- Xác định mức hỗ trợ/kháng cự

### trend-analyzer.service.ts
Service phân tích xu hướng thị trường:
- Xác định xu hướng chính (uptrend, downtrend, sideways)
- Phát hiện các điểm đảo chiều
- Đánh giá sức mạnh xu hướng

## Thứ tự triển khai đề xuất

1. Triển khai các Binance API clients (REST và WebSocket)
2. Xây dựng rate limiter
3. Tạo adapter để chuẩn hóa dữ liệu
4. Triển khai market data stream service
5. Xây dựng market và trend analyzer
6. Tạo controller và module
7. Cài đặt market analyzer task

## Dependencies chính

- axios (cho HTTP requests)
- ws (cho WebSocket)
- Redis (cho cache)
- Bull (cho task scheduling)
- NestJS Schedule