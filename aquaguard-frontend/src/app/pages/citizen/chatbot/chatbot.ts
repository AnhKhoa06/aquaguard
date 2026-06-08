import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class ChatbotComponent implements OnInit {
  isOpen = false;
  isLoading = false;
  inputText = '';
  messages: Message[] = [];
  unreadCount = 0;

  suggestedQuestions = ['AquaGuard là gì?', 'Làm gì khi gặp lũ lụt?', 'Cách gửi yêu cầu SOS?'];

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (e) {}
  }

  ngOnInit() {
    this.messages = [
      {
        role: 'assistant',
        content:
          'Xin chào! 👋 Tôi là AquaGuard AI Assistant. Hãy hỏi tôi về an toàn lũ lụt, cứu hộ hoặc cách sử dụng AquaGuard!',
        time: this.getTime(),
      },
    ];
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.unreadCount = 0;
  }

  closeChat() {
    this.isOpen = false;
  }

  askSuggested(question: string) {
    this.inputText = question;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text, time: this.getTime() }); //Hiển thị tin nhắn user lên chat
    this.inputText = ''; //xóa input
    this.isLoading = true; //bật load

    const payload = this.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant') //Lọc chỉ lấy user và assistant
      .map((m) => ({ role: m.role, content: m.content })) //map chỉ lấy role và content
      .filter((_, i, arr) => !(i === 0 && arr[0].role === 'assistant')); // bỏ tin nhắn bot đầu tiên

    this.http.post<any>(`${environment.apiUrl}/chat`, { messages: payload }).subscribe({
      next: (res) => {
        if (res.success) {
          this.messages.push({
            role: 'assistant',
            content: res.data,
            time: this.getTime(),
          });
          this.unreadCount++; // ← bỏ điều kiện !isOpen
          console.log('unreadCount:', this.unreadCount);
        }
        this.isLoading = false;
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!',
          time: this.getTime(),
        });
        this.isLoading = false;
      },
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getTime(): string {
    return new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
