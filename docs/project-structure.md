# Cấu trúc dự án với đánh số thứ tự file

```
# Core Framework Files
├── 001. src/main.ts                           # Điểm khởi đầu ứng dụng
├── 002. src/app.module.ts                     # Module chính
├── 003. src/app.controller.ts                 # Controller chính 
├── 004. src/app.service.ts                    # Service chính
├── 005. src/app.controller.spec.ts            # Test cho controller chính

# Configuration
├── src/config/                                # Cấu hình ứng dụng
│   ├── 006. env.config.ts                     # Biến môi trường
│   ├── 007. database.config.ts                # Cấu hình database
│   ├── 008. orm.config.ts                     # Cấu hình ORM
│   ├── 009. const.config.ts                   # Các hằng số
│   ├── 010. rate-limit.config.ts              # Cấu hình giới hạn request
│   ├── 011. swagger.config.ts                 # Cấu hình Swagger
│   ├── 012. cache.config.ts                   # Cấu hình cache
│   ├── 013. queue.config.ts                   # Cấu hình queue
│   └── 014. logging.config.ts                 # Cấu hình logging

# Shared Components
├── src/shared/                                # Các thành phần dùng chung
│   ├── interfaces/                            # Các interface dùng chung
│   │   ├── 015. common.interface.ts           # Interface chung
│   │   ├── 016. market-data.interface.ts      # Interface dữ liệu thị trường
│   │   ├── 017. repository.interface.ts       # Interface repository base
│   │   └── 018. service.interface.ts          # Interface service base
│   ├── utils/                                 # Các tiện ích
│   │   ├── 019. time.helper.ts                # Hỗ trợ xử lý thời gian
│   │   ├── 020. formula.helper.ts             # Các công thức tính toán
│   │   ├── 021. fibonacci.helper.ts           # Hỗ trợ tính toán Fibonacci
│   │   ├── 022. validation.helper.ts          # Hỗ trợ xác thực dữ liệu
│   │   └── 023. http.helper.ts                # Hỗ trợ HTTP request
│   ├── constants/                             # Các hằng số và Enum
│   │   ├── 024. constants.ts                  # Các hằng số dùng chung
│   │   ├── 025. pattern-type.enum.ts          # Enum loại mô hình
│   │   ├── 026. timeframe.enum.ts             # Enum khung thời gian
│   │   └── 027. trade-direction.enum.ts       # Enum hướng giao dịch
│   ├── decorators/                            # Các decorator tùy chỉnh
│   │   ├── 028. validate.decorator.ts         # Decorator xác thực
│   │   └── 029. log.decorator.ts              # Decorator ghi log
│   ├── filters/                               # Các filter
│   │   ├── 030. http-exception.filter.ts      # Filter xử lý ngoại lệ HTTP
│   │   └── 031. validation.filter.ts          # Filter xác thực dữ liệu
│   ├── interceptors/                          # Các interceptor
│   │   ├── 032. transform.interceptor.ts      # Interceptor biến đổi dữ liệu
│   │   ├── 033. cache.interceptor.ts          # Interceptor cache
│   │   └── 034. logging.interceptor.ts        # Interceptor ghi log
│   ├── middlewares/                           # Các middleware
│   │   ├── 035. logger.middleware.ts          # Middleware ghi log
│   │   └── 036. auth.middleware.ts            # Middleware xác thực
│   ├── pipes/                                 # Các pipe
│   │   ├── 037. validation.pipe.ts            # Pipe xác thực
│   │   └── 038. parse-int.pipe.ts             # Pipe parse int
│   └── exceptions/                            # Xử lý ngoại lệ
│       ├── 039. custom.exception.ts           # Ngoại lệ tùy chỉnh
│       └── 040. api-error.exception.ts        # Ngoại lệ API

# Database & Migrations
├── src/infrastructure/                        # Cơ sở hạ tầng
│   ├── database/                              # Xử lý cơ sở dữ liệu
│   │   ├── migrations/                        # Các migration
│   │   │   ├── 041. 1684921464081-create_users_table.ts # Migration tạo bảng users
│   │   │   ├── 042. create_patterns_table.ts  # Migration tạo bảng patterns
│   │   │   ├── 043. create_trades_table.ts    # Migration tạo bảng trades
│   │   │   ├── 044. create_pattern_points_table.ts # Migration tạo bảng pattern_points
│   │   │   ├── 045. create_trade_setups_table.ts # Migration tạo bảng trade_setups
│   │   │   ├── 046. create_risk_profiles_table.ts # Migration tạo bảng risk_profiles
│   │   │   └── 047. create_notifications_table.ts # Migration tạo bảng notifications
│   │   ├── seeds/                             # Seed data
│   │   │   ├── 048. harmonic-ratios.seed.ts   # Seed tỷ lệ harmonic
│   │   │   ├── 049. test-data.seed.ts         # Seed dữ liệu test
│   │   │   └── 050. seed.ts                   # Entry point for seeds
│   │   └── repositories/                      # Các repository triển khai
│   │       ├── 051. base.repository.ts        # Repository cơ sở
│   │       ├── 052. pattern.repository.ts     # Repository mô hình
│   │       └── 053. trade.repository.ts       # Repository giao dịch

# External Integrations
│   ├── external/                              # Tích hợp bên ngoài
│   │   ├── binance/                           # Tích hợp Binance API
│   │   │   ├── 054. binance.client.ts         # Client Binance REST API
│   │   │   ├── 055. binance-websocket.client.ts # Client Binance WebSocket
│   │   │   ├── 056. binance.adapter.ts        # Adapter cho Binance
│   │   │   ├── 057. rate-limiter.ts           # Giới hạn số request
│   │   │   ├── 058. market-data-stream.service.ts # Dịch vụ luồng dữ liệu
│   │   │   ├── 059. trading-api.service.ts    # Service giao dịch qua API
│   │   │   └── 060. binance.types.ts          # Các type cho Binance API
│   │   ├── telegram/                          # Tích hợp Telegram
│   │   │   ├── 061. telegram.service.ts       # Service Telegram
│   │   │   ├── 062. telegram.module.ts        # Module Telegram
│   │   │   └── 063. telegram.config.ts        # Cấu hình Telegram
│   │   └── openai/                            # Tích hợp OpenAI (Có thể loại bỏ giai đoạn đầu)
│   │       ├── 064. openai.service.ts         # Service OpenAI
│   │       └── 065. openai.module.ts          # Module OpenAI

# Infrastructure Services
│   ├── cache/                                 # Hệ thống cache
│   │   ├── 066. redis-cache.service.ts        # Redis cache service
│   │   ├── 067. in-memory-cache.service.ts    # Cache trong bộ nhớ
│   │   └── 068. cache.module.ts               # Module cache
│   ├── queue/                                 # Hàng đợi xử lý
│   │   ├── 069. queue.service.ts              # Service hàng đợi cơ bản
│   │   ├── 070. bull-queue.service.ts         # Service Bull queue
│   │   └── 071. queue.module.ts               # Module queue
│   └── event-bus/                             # Hệ thống event-driven
│       ├── 072. event-bus.service.ts          # Service truyền sự kiện
│       ├── 073. event-bus.module.ts           # Module event bus
│       └── event-handlers/                    # Xử lý sự kiện
│           ├── 074. market-data-handler.ts    # Xử lý dữ liệu thị trường mới
│           └── 075. pattern-detected-handler.ts # Xử lý phát hiện mô hình

# Candlestick Pattern Library
├── src/libs/                                  # Thư viện và modules
│   └── candlestick/                           # Thư viện nhận dạng nến
│       ├── 076. CandlestickFinder.ts          # Base class cho các finder
│       ├── 077. Candlestick.ts                # Class quản lý các loại nến
│       ├── 078. Doji.ts                       # Pattern Doji
│       ├── 079. DragonFlyDoji.ts              # Pattern DragonFly Doji
│       ├── 080. GraveStoneDoji.ts             # Pattern GraveStone Doji
│       ├── 081. BearishHammerStick.ts         # Pattern BearishHammerStick
│       ├── 082. BullishHammerStick.ts         # Pattern BullishHammerStick
│       ├── 083. BearishInvertedHammerStick.ts # Pattern BearishInvertedHammerStick
│       ├── 084. BullishInvertedHammerStick.ts # Pattern BullishInvertedHammerStick
│       ├── 085. BearishMarubozu.ts            # Pattern BearishMarubozu
│       ├── 086. BullishMarubozu.ts            # Pattern BullishMarubozu
│       ├── 087. BearishSpinningTop.ts         # Pattern BearishSpinningTop
│       ├── 088. BullishSpinningTop.ts         # Pattern BullishSpinningTop
│       ├── 089. GroupCandlestickFinder.ts     # Finder cho nhóm nến
│       └── 090. StockGroupCandleData.ts       # Data class cho nhóm nến

# Domain - Core Business Logic
├── src/domain/                                # Lõi domain
│   ├── harmonic-patterns/                     # Domain mô hình harmonic
│   │   ├── entities/                          # Các entity
│   │   │   ├── 091. harmonic-pattern.entity.ts # Entity mô hình harmonic
│   │   │   └── 092. pattern-point.entity.ts   # Entity điểm mô hình
│   │   ├── dtos/                              # DTOs
│   │   │   ├── 093. pattern.dto.ts            # DTO mô hình
│   │   │   └── 094. pattern-point.dto.ts      # DTO điểm mô hình
│   │   ├── interfaces/                        # Interfaces
│   │   │   └── 095. pattern-ratio.interface.ts # Interface tỷ lệ mô hình
│   │   ├── services/                          # Các service domain
│   │   │   ├── 096. pattern-base.service.ts   # Service cơ sở cho mô hình
│   │   │   ├── 097. cypher-pattern.service.ts # Service mô hình Cypher
│   │   │   ├── 098. bat-pattern.service.ts    # Service mô hình BAT
│   │   │   ├── 099. butterfly-pattern.service.ts # Service mô hình Butterfly
│   │   │   ├── 100. gartley-pattern.service.ts # Service mô hình Gartley
│   │   │   ├── 101. crab-pattern.service.ts   # Service mô hình Crab
│   │   │   └── 102. point-predictor.service.ts # Service dự đoán điểm
│   │   ├── controllers/                       # Controllers
│   │   │   └── 103. harmonic-pattern.controller.ts # Controller mô hình harmonic
│   │   └── 104. harmonic-pattern.module.ts    # Module mô hình harmonic

# Technical Indicators Module
│   ├── technical-indicators/                  # Domain chỉ báo kỹ thuật
│   │   ├── entities/                          # Các entity
│   │   │   └── 105. indicator.entity.ts       # Entity chỉ báo
│   │   ├── dtos/                              # DTOs
│   │   │   ├── 106. indicator.dto.ts          # DTO chỉ báo
│   │   │   └── 107. ichimoku.dto.ts           # DTO Ichimoku
│   │   ├── services/                          # Các service domain
│   │   │   ├── 108. indicator-base.service.ts # Service cơ sở cho chỉ báo
│   │   │   ├── 109. ichimoku.service.ts       # Service Ichimoku
│   │   │   ├── 110. rsi.service.ts            # Service RSI
│   │   │   └── 111. macd.service.ts           # Service MACD
│   │   ├── controllers/                       # Controllers
│   │   │   └── 112. indicator.controller.ts   # Controller chỉ báo kỹ thuật
│   │   └── 113. technical-indicator.module.ts # Module chỉ báo kỹ thuật

# Trading Module
│   ├── trading/                               # Domain giao dịch
│   │   ├── entities/                          # Các entity
│   │   │   ├── 114. trade.entity.ts           # Entity giao dịch
│   │   │   └── 115. trade-setup.entity.ts     # Entity thiết lập giao dịch
│   │   ├── dtos/                              # DTOs
│   │   │   ├── 116. trade.dto.ts              # DTO giao dịch
│   │   │   └── 117. trade-setup.dto.ts        # DTO thiết lập giao dịch
│   │   ├── services/                          # Các service domain
│   │   │   ├── 118. trade.service.ts          # Service giao dịch
│   │   │   ├── 119. trade-executor.service.ts # Service thực thi giao dịch
│   │   │   └── 120. trade-setup.service.ts    # Service thiết lập giao dịch
│   │   ├── controllers/                       # Controllers
│   │   │   └── 121. trading.controller.ts     # Controller giao dịch
│   │   └── 122. trading.module.ts             # Module giao dịch

# Risk Management Module
│   ├── risk-management/                       # Domain quản lý rủi ro
│   │   ├── entities/                          # Các entity
│   │   │   └── 123. risk-profile.entity.ts    # Entity hồ sơ rủi ro
│   │   ├── dtos/                              # DTOs
│   │   │   └── 124. risk-params.dto.ts        # DTO tham số rủi ro
│   │   ├── services/                          # Các service domain
│   │   │   ├── 125. risk-calculator.service.ts # Service tính toán rủi ro
│   │   │   └── 126. position-sizer.service.ts # Service tính kích thước vị thế
│   │   ├── controllers/                       # Controllers
│   │   │   └── 127. risk-management.controller.ts # Controller quản lý rủi ro
│   │   └── 128. risk-management.module.ts     # Module quản lý rủi ro

# Notification Module
│   ├── notification/                          # Domain thông báo
│   │   ├── entities/                          # Các entity
│   │   │   └── 129. notification.entity.ts    # Entity thông báo
│   │   ├── dtos/                              # DTOs
│   │   │   └── 130. notification.dto.ts       # DTO thông báo
│   │   ├── services/                          # Các service domain
│   │   │   └── 131. notification.service.ts   # Service thông báo
│   │   ├── controllers/                       # Controllers
│   │   │   └── 132. notification.controller.ts # Controller thông báo
│   │   └── 133. notification.module.ts        # Module thông báo

# Market Analysis Module
│   ├── market-analysis/                       # Domain phân tích thị trường
│   │   ├── entities/                          # Các entity
│   │   │   └── 134. market-data.entity.ts     # Entity dữ liệu thị trường
│   │   ├── dtos/                              # DTOs
│   │   │   └── 135. market-data.dto.ts        # DTO dữ liệu thị trường
│   │   ├── services/                          # Các service domain
│   │   │   ├── 136. market-analyzer.service.ts # Service phân tích thị trường
│   │   │   └── 137. trend-analyzer.service.ts # Service phân tích xu hướng
│   │   ├── controllers/                       # Controllers
│   │   │   └── 138. market.controller.ts      # Controller thị trường
│   │   └── 139. market-analysis.module.ts     # Module phân tích thị trường

# Backtesting Module
│   ├── backtesting/                           # Domain backtesting
│   │   ├── entities/                          # Các entity
│   │   │   └── 140. backtest.entity.ts        # Entity backtesting
│   │   ├── dtos/                              # DTOs
│   │   │   └── 141. backtest.dto.ts           # DTO backtesting
│   │   ├── services/                          # Các service domain
│   │   │   ├── 142. backtest-runner.service.ts # Service chạy backtest
│   │   │   └── 143. performance-analyzer.service.ts # Service phân tích hiệu suất
│   │   ├── controllers/                       # Controllers
│   │   │   └── 144. backtest.controller.ts    # Controller backtest
│   │   └── 145. backtesting.module.ts         # Module backtesting

# Real-time Module
│   └── real-time/                             # Domain xử lý thời gian thực
│       ├── entities/                          # Các entity
│       │   └── 146. streaming-data.entity.ts  # Entity dữ liệu luồng
│       ├── dtos/                              # DTOs
│       │   └── 147. stream-data.dto.ts        # DTO dữ liệu luồng
│       ├── gateways/                          # WebSocket gateways
│       │   ├── 148. market-data.gateway.ts    # Gateway dữ liệu thị trường
│       │   └── 149. signal.gateway.ts         # Gateway tín hiệu giao dịch
│       ├── services/                          # Các service domain
│       │   └── 150. stream-processor.service.ts # Service xử lý luồng dữ liệu
│       └── 151. real-time.module.ts           # Module xử lý thời gian thực

# Binance Module
├── src/binances/                              # Module Binance 
│   ├── 152. binance.module.ts                 # Module Binance
│   ├── 153. binance.controller.ts             # Controller Binance
│   └── 154. binance.service.ts                # Service Binance

# Machine Learning Module (Optional - Có thể loại bỏ giai đoạn đầu)
├── src/machine-learning/                      # Lớp Machine Learning
│   ├── models/                                # Các mô hình ML
│   │   ├── 155. harmonic-classifier.model.ts  # Mô hình phân loại harmonic
│   │   └── 156. price-predictor.model.ts      # Mô hình dự đoán giá
│   ├── dtos/                                  # DTOs
│   │   └── 157. ml-prediction.dto.ts          # DTO dự đoán ML
│   ├── services/                              # Các service ML
│   │   ├── 158. ml-trainer.service.ts         # Service huấn luyện mô hình
│   │   └── 159. ml-predictor.service.ts       # Service dự đoán
│   ├── controllers/                           # Controllers 
│   │   └── 160. ml.controller.ts              # Controller Machine Learning
│   └── 161. machine-learning.module.ts        # Module Machine Learning

# Task Scheduling
├── src/tasks/                                 # Công việc định kỳ 
│   ├── 162. tasks.module.ts                   # Module tasks
│   ├── 163. tasks.service.ts                  # Service quản lý tasks
│   ├── 164. pattern-detector.task.ts          # Task phát hiện mô hình
│   ├── 165. market-analyzer.task.ts           # Task phân tích thị trường
│   └── 166. trade-executor.task.ts            # Task thực thi giao dịch

# Helpers
├── src/helpers/                               # Helpers
│   ├── 167. time.helper.ts                    # Helper xử lý thời gian
│   ├── 168. formula.helper.ts                 # Helper công thức toán học
│   └── 169. validation.helper.ts              # Helper xác thực dữ liệu

# User Module
├── src/user/                                  # User module
│   ├── 170. user.module.ts                    # Module user
│   ├── 171. user.controller.ts                # Controller user
│   ├── 172. user.service.ts                   # Service user
│   └── entities/                              # Entities
│       └── 173. user.entity.ts                # Entity user

# Testing
├── test/                                      # Tests
│   ├── 174. app.e2e-spec.ts                   # E2E test cho app
│   ├── 175. jest-e2e.json                     # Cấu hình Jest E2E
│   └── unit/                                  # Unit tests
│       ├── 176. binance.service.spec.ts       # Test cho Binance service
│       └── 177. harmonic-pattern.service.spec.ts # Test cho Harmonic pattern service

# Configuration Files
├── 178. .env                                  # File biến môi trường
├── 179. .env.example                          # Mẫu file biến môi trường
├── 180. .gitignore                            # Cấu hình Git ignore
├── 181. .dockerignore                         # Docker ignore
├── 182. nest-cli.json                         # Cấu hình NestJS CLI
├── 183. tsconfig.json                         # Cấu hình TypeScript
├── 184. tsconfig.build.json                   # Cấu hình TypeScript (build)
├── 185. package.json                          # Cấu hình npm/yarn
├── 186. README.md                             # Tài liệu tổng quan
├── 187. LICENSE                               # Giấy phép
├── 188. jest.config.js                        # Cấu hình Jest
├── 189. .eslintrc.js                          # Cấu hình ESLint
├── 190. .prettierrc                           # Cấu hình Prettier
├── 191. webpack.config.js                     # Cấu hình Webpack

# Docker Deployment
├── docker/                                    # Docker configuration
│   ├── 192. Dockerfile                        # Dockerfile chính
│   ├── 193. Dockerfile.dev                    # Dockerfile cho development
│   ├── 194. docker-compose.yml                # Docker Compose cho production
│   ├── 195. docker-compose.dev.yml            # Docker Compose cho development
│   ├── 196. .docker-env                       # Docker environment variables
│   └── 197. entrypoint.sh                     # Entry point script

# Documentation
└── docs/                                      # Documentation
    ├── 198. api-docs.md                       # API Documentation
    ├── 199. architecture.md                   # Architecture Documentation
    ├── 200. setup-guide.md                    # Setup Guide
    ├── 201. harmonic-patterns.md              # Harmonic Patterns Guide
    └── 202. ichimoku-cloud.md                 # Ichimoku Cloud Guide
```