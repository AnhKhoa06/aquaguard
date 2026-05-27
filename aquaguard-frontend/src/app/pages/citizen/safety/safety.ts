import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SafetyItem {
  title: string;
  badge: string;
  badgeColor: string;
  iconBg: string;
  icon: string;
  tips: string[];
  isOpen: boolean;
}

@Component({
  selector: 'app-safety',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './safety.html',
  styleUrls: ['./safety.scss']
})
export class SafetyComponent {
  safetyItems: SafetyItem[] = [
    {
      title: 'Trước lũ lụt',
      badge: 'THÔNG TIN',
      badgeColor: 'info',
      iconBg: '#0d9488',
      icon: 'inventory_2',
      isOpen: true,
      tips: [
        'Chuẩn bị bộ dụng cụ khẩn cấp (nước, thực phẩm, đèn pin, sơ cứu, pin).',
        'Xác định các tuyến đường sơ tán an toàn nhất đến vùng cao hơn.',
        'Giữ các tài liệu quan trọng trong hộp chống nước.',
        'Di chuyển các vật dụng thiết yếu, đồ điện tử và đồ có giá trị lên tầng trên.',
      ]
    },
    {
      title: 'Trong lũ lụt',
      badge: 'NGHIÊM TRỌNG',
      badgeColor: 'danger',
      iconBg: '#ef4444',
      icon: 'home',
      isOpen: false,
      tips: [
        'Di chuyển đến vùng cao hơn ngay lập tức.',
        'Tránh đi bộ hoặc lái xe qua nước lũ (15cm nước chảy có thể quật ngã bạn).',
        'Tránh xa các đường dây điện bị đổ và dây điện.',
        'Tắt các tiện ích tại công tắc chính nếu được hướng dẫn.',
        'Lắng nghe các bản tin khẩn cấp để cập nhật thông tin mới nhất.',
      ]
    },
    {
      title: 'Sau lũ lụt',
      badge: 'TRUNG BÌNH',
      badgeColor: 'warning',
      iconBg: '#10b981',
      icon: 'assignment',
      isOpen: false,
      tips: [
        'Chỉ trở về nhà khi chính quyền thông báo an toàn.',
        'Mặc quần áo bảo hộ, bao gồm ủng cao su và găng tay.',
        'Ghi lại thiệt hại tài sản bằng ảnh để yêu cầu bảo hiểm.',
        'Chú ý hư hỏng kết cấu, nấm mốc và động vật hoang dã.',
        'Không uống nước máy cho đến khi được tuyên bố an toàn.',
      ]
    },
    {
      title: 'Hướng dẫn Sơ tán',
      badge: 'CAO',
      badgeColor: 'high',
      iconBg: '#f97316',
      icon: 'directions_run',
      isOpen: false,
      tips: [
        'Rời đi ngay lập tức khi chính quyền khuyến cáo sơ tán.',
        'Mang theo bộ dụng cụ khẩn cấp và thuốc thiết yếu.',
        'Khóa nhà trước khi rời đi.',
        'Đi theo các tuyến đường sơ tán được chỉ định; không đi đường tắt.',
        'Nếu bị kẹt, không cố bơi đến nơi an toàn. Chờ đội cứu hộ.',
      ]
    },
    {
      title: 'Cấp cứu Y tế',
      badge: 'TRUNG BÌNH',
      badgeColor: 'warning',
      iconBg: '#ef4444',
      icon: 'medical_services',
      isOpen: false,
      tips: [
        'Lau sạch và băng bó tất cả vết thương hở ngay lập tức để tránh nhiễm trùng.',
        'Tìm kiếm sự chăm sóc y tế khẩn cấp nếu nghi ngờ bệnh do nước.',
        'Tránh hạ thân nhiệt bằng cách thay quần áo ướt và giữ ấm.',
        'Luôn giữ bộ sơ cứu cơ bản ở nơi dễ lấy.',
      ]
    },
  ];

  toggle(selectedItem: SafetyItem) {
    // Đóng tất cả các item khác
    this.safetyItems.forEach(item => {
      if (item !== selectedItem) {
        item.isOpen = false;
      }
    });

    // Toggle item được click
    selectedItem.isOpen = !selectedItem.isOpen;
  }
}