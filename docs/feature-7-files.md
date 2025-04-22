# Feature 7: Trading & Risk Management

## Mô tả
Feature này quản lý việc tạo và thực hiện các giao dịch, cùng với hệ thống quản lý rủi ro toàn diện.

## Danh sách file cần triển khai

### Trading Domain - Entities & DTOs
```
114. src/domain/trading/entities/trade.entity.ts           # Entity giao dịch
115. src/domain/trading/entities/trade-setup.entity.ts     # Entity thiết lập giao dịch

116. src/domain/trading/dtos/trade.dto.ts                  # DTO giao dịch
117. src/domain/trading/dtos/trade-setup.dto.ts            # DTO thiết lập giao dịch
```

### Trading Domain - Services
```
118. src/domain/trading/services/trade.service.ts          # Service giao dịch
119. src/domain/trading/services/trade-executor.service.ts # Service thực thi giao dịch
120. src/domain/trading/services/trade-setup.service.ts    # Service thiết lập giao dịch
```

### Trading Domain - Controller & Module
```
121. src/domain/trading/controllers/trading.controller.ts  # Controller giao dịch
122. src/domain/trading/trading.module.ts                  # Module giao dịch
```

### Risk Management Domain
```
123. src/domain/risk-management/entities/risk-profile.entity.ts    # Entity hồ sơ rủi ro
124. src/domain/risk-management/dtos/risk-params.dto.ts            # DTO tham số rủi ro
125. src/domain/risk-management/services/risk-calculator.service.ts # Service tính toán rủi ro
126. src/domain/risk-management/services/position-sizer.service.ts  # Service tính kích thước vị thế
127. src/domain/risk-management/controllers/risk-management.controller.ts # Controller quản lý rủi ro
128. src/domain/risk-management/risk-management.module.ts           # Module quản lý rủi ro
```

### Trade Executor Task
```
166. src/tasks/trade-executor.task.ts            # Task thực thi giao dịch
```

## Chi tiết triển khai

### trade.service.ts
Service quản lý tất cả các giao dịch trong hệ thống:
- Tạo giao dịch mới
- Cập nhật trạng thái giao dịch
- Tính toán lợi nhuận/lỗ
- Quản lý lịch sử giao dịch

### trade-executor.service.ts
Service thực thi các giao dịch:
- Thực hiện giao dịch (giai đoạn đầu là giả lập)
- Theo dõi các điều kiện thị trường
- Quyết định thời điểm đóng giao dịch
- Xử lý các sự kiện thị trường

### trade-setup.service.ts
Service quản lý thiết lập giao dịch trước khi thực thi:
- Tạo thiết lập giao dịch dựa trên mô hình harmonic
- Tính toán giá vào lệnh, stop loss, take profit
- Đánh giá chất lượng thiết lập

### risk-calculator.service.ts
Service tính toán các tham số rủi ro:
- Tính toán % vốn có thể rủi ro cho mỗi giao dịch
- Xác định tỷ lệ risk-reward
- Đánh giá rủi ro tổng thể của danh mục
- Theo dõi giới hạn rủi ro hàng ngày/tuần

### position-sizer.service.ts
Service tính toán kích thước vị thế tối ưu:
- Tính toán số lượng đơn vị giao dịch dựa trên rủi ro cho phép
- Điều chỉnh kích thước dựa trên biến động thị trường
- Xác định đòn bẩy phù hợp (nếu có)

### trade-executor.task.ts
Task định kỳ kiểm tra và thực thi giao dịch:
- Kiểm tra các thiết lập giao dịch đang chờ
- Kiểm tra điều kiện thị trường
- Thực thi giao dịch khi điều kiện thỏa mãn
- Theo dõi và đóng các giao dịch hiện có khi cần

## Thứ tự triển khai đề xuất

1. Tạo các entities và DTOs
2. Triển khai risk-calculator.service.ts và position-sizer.service.ts
3. Xây dựng trade.service.ts
4. Triển khai trade-setup.service.ts
5. Xây dựng trade-executor.service.ts
6. Tạo các controllers và modules
7. Triển khai trade-executor.task.ts

## Dependencies chính

- NestJS
- TypeORM
- Bull Queue (cho task scheduling)
- Binance API Integration (Feature 6)