# Feature 5: Technical Indicators

## Mô tả
Feature này cung cấp các chỉ báo kỹ thuật bổ sung để hỗ trợ việc xác nhận các mô hình Harmonic, bao gồm Ichimoku Cloud, RSI và MACD.

## Danh sách file cần triển khai

### Entities
```
105. src/domain/technical-indicators/entities/indicator.entity.ts       # Entity chỉ báo
```

### DTOs
```
106. src/domain/technical-indicators/dtos/indicator.dto.ts              # DTO chỉ báo
107. src/domain/technical-indicators/dtos/ichimoku.dto.ts               # DTO Ichimoku
```

### Services
```
108. src/domain/technical-indicators/services/indicator-base.service.ts # Service cơ sở cho chỉ báo
109. src/domain/technical-indicators/services/ichimoku.service.ts       # Service Ichimoku
110. src/domain/technical-indicators/services/rsi.service.ts            # Service RSI
111. src/domain/technical-indicators/services/macd.service.ts           # Service MACD
```

### Controller & Module
```
112. src/domain/technical-indicators/controllers/indicator.controller.ts   # Controller chỉ báo kỹ thuật
113. src/domain/technical-indicators/technical-indicator.module.ts         # Module chỉ báo kỹ thuật
```

## Chi tiết triển khai

### indicator-base.service.ts
Service cơ sở cung cấp các phương thức và thuộc tính chung cho tất cả các chỉ báo kỹ thuật.

#### Chức năng chính:
- Xử lý dữ liệu thị trường (candlestick data)
- Tính toán các giá trị cơ bản (SMA, EMA)
- Cung cấp interface chung cho các service con

### ichimoku.service.ts
Service tính toán đám mây Ichimoku Cloud, một chỉ báo kỹ thuật phổ biến dùng để xác định xu hướng thị trường.

#### Thành phần Ichimoku:
- Tenkan-sen (Conversion Line): (9-period high + 9-period low)/2
- Kijun-sen (Base Line): (26-period high + 26-period low)/2
- Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen)/2 (shifted forward 26 periods)
- Senkou Span B (Leading Span B): (52-period high + 52-period low)/2 (shifted forward 26 periods)
- Chikou Span (Lagging Span): Current closing price (shifted backwards 26 periods)

### rsi.service.ts
Service tính toán Relative Strength Index (RSI), một chỉ báo dao động dùng để xác định tình trạng quá mua hoặc quá bán.

#### Công thức RSI:
- RSI = 100 - (100 / (1 + RS))
- RS = Average Gain / Average Loss

### macd.service.ts
Service tính toán Moving Average Convergence Divergence (MACD), chỉ báo theo xu hướng.

#### Thành phần MACD:
- MACD Line: (12-day EMA - 26-day EMA)
- Signal Line: 9-day EMA của MACD Line
- Histogram: MACD Line - Signal Line

## Thứ tự triển khai đề xuất

1. Tạo entity và DTOs
2. Triển khai indicator-base.service.ts
3. Triển khai các service con (ichimoku, rsi, macd)
4. Tạo controller và module
5. Tích hợp với module Harmonic Pattern Recognition

## Dependencies chính

- NestJS
- Mathematical calculation libraries
- TypeORM (cho entity management)