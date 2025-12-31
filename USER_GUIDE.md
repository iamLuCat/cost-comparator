# Hướng Dẫn Sử Dụng Tool Đối Chiếu Chi Phí (Cost Comparator)

Tool này giúp bạn tự động đối chiếu chi phí giữa hai bên (ví dụ: Bên A - Kế toán nội bộ vs Bên B - Hãng tàu/Nhà cung cấp) dựa trên các file Excel.

## 1. Chuẩn Bị File Excel
Để tool hoạt động chính xác tốt nhất, file Excel của bạn nên có:
- **Dòng tiêu đề**: Chứa tên các cột (Ví dụ: `Số Container`, `Số Hóa Đơn`, `Phí THC`, `Phí Vệ Sinh`...).
- **Dữ liệu**: Nằm ngay dưới dòng tiêu đề.

## 2. Bắt Đầu Sử Dụng
Truy cập vào trang web ứng dụng.

### Bước 1: Tải File Lên
1. **Bên A (File Gốc/Nội bộ)**: 
   - Nhấn vào khu vực "Upload BÊN A".
   - Chọn một hoặc nhiều file Excel (.xlsx, .xls) của bạn.
2. **Bên B (File Đối tác/Hãng tàu)**: 
   - Nhấn vào khu vực "Upload BÊN B".
   - Chọn file Excel của đối tác.

*Lưu ý: Tool sẽ tự động đọc tất cả các Sheet trong file Excel.*

### Bước 2: Kiểm Tra & Chỉnh Sửa Cột (Quan Trọng)
Sau khi tải file, tool sẽ tự động nhận diện các cột dựa trên tên. Bạn cần kiểm tra lại ở phần **Mapping Doanh Thu/Chi Phí**:

- **Cột Định Danh (Bắt buộc)**:
  - `Số Container`: Chọn cột chứa số xe/số container để làm khóa đối chiếu.
  - `Ngày tháng`: Chọn cột chứa ngày làm lệnh (để hiển thị chi tiết).
  - `Số Hóa Đơn`: Chọn cột số hóa đơn (nếu có).

- **Các Loại Chi Phí**:
  - Tool sẽ tự động điền các ô như `Phí nâng hạ`, `Cược cont`, `Phí vệ sinh` nếu tìm thấy tên cột tương ứng.
  - Nếu tool chọn sai hoặc chưa chọn, bạn hãy click vào ô và chọn lại cột đúng từ danh sách.

### Bước 3: Thêm Chi Phí Khác (Tùy Chọn)
Nếu bạn có các cột chi phí đặc thù không có sẵn trong danh sách (Ví dụ: "Phí bồi dưỡng", "Phí seal"...):
1. Nhấn nút **"+ Thêm Chi Phí"**.
2. Nhập tên loại chi phí (Ví dụ: `Phí Seal`).
3. **Mẹo hay**: Bạn có thể nhập vị trí ô Excel vào ô tìm kiếm nhanh (Ví dụ: `H1` cho bên A, `K3` cho bên B) để tool tự động tìm tên cột.
4. Tích chọn cột tương ứng ở cả Bên A và Bên B.
5. Nhấn "Thêm Chi Phí".

### Bước 4: So Sánh
Sau khi đã chọn đủ các cột cần thiết, nhấn nút **"So Sánh Ngay"** màu xanh.

## 3. Xem Kết Quả & Báo Cáo
Bảng kết quả sẽ hiện ra bên dưới:

- **Trạng Thái**:
  - <span style="color:green">**KHỚP**</span>: Tổng chi phí 2 bên bằng nhau.
  - <span style="color:red">**LỆCH**</span>: Tổng chi phí khác nhau.
  - <span style="color:#ca8a04">**THIẾU A / THIẾU B**</span>: Số container này chỉ xuất hiện ở 1 bên.

- **Chức Năng**:
  - **Lọc kết quả**: Sử dụng các nút `Tất cả`, `Lệch`, `Thiếu`, `Khớp` để lọc nhanh.
  - **Tìm kiếm**: Nhập số container vào ô tìm kiếm.
  - **Xem chi tiết**: Bấm vào bất kỳ dòng nào để xem chi tiết các khoản mục chi phí của từng bên (giúp biết lệch ở khoản nào: phí nâng hay phí hạ...).
  - **Sắp xếp**: Bấm vào tiêu đề cột (Số Cont, Tổng A, Tổng B, Chênh lệch) để sắp xếp tăng/giảm dần.

### Xuất Báo Cáo
Nhấn nút **Download (Biểu tượng Tải xuống)** ở góc phải bảng để tải về file Excel báo cáo chi tiết.
