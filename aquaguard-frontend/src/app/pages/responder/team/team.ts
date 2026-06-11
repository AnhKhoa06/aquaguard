import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RescueTeamService } from '../../../core/services/rescue-team.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-responder-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class TeamComponent implements OnInit {
  loading = true;
  teams: any[] = [];
  selectedTeamId: number | null = null;
  currentUserId: number | null = null;
  myJoinRequest: any = null;
  joiningTeamId: number | null = null;
  leaving = false;

  constructor(
    private rescueTeamService: RescueTeamService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id || null;
    this.loadTeams();
    this.loadMyJoinRequest();
  }

  loadTeams(): void {
    this.rescueTeamService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.teams = res.data;
          if (this.teams.length > 0) {
            // Ưu tiên chọn đội của mình trước
            const myTeam = this.teams.find((t) =>
              t.members?.some((m: any) => m.id === this.currentUserId),
            );
            this.selectedTeamId = myTeam ? myTeam.id : this.teams[0].id;
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadMyJoinRequest(): void {
    this.rescueTeamService.getMyJoinRequest().subscribe({
      next: (res) => {
        if (res.success) this.myJoinRequest = res.data;
      },
    });
  }

  requestJoin(teamId: number): void {
    this.joiningTeamId = teamId;
    this.rescueTeamService.requestJoin(teamId).subscribe({
      next: (res) => {
        if (res.success) {
          this.myJoinRequest = { team_id: teamId, status: 'pending' };
        }
        this.joiningTeamId = null;
      },
      error: (err) => {
        this.joiningTeamId = null;
      },
    });
  }

  getJoinStatus(teamId: number): string | null {
    if (!this.myJoinRequest) return null;
    if (this.myJoinRequest.team_id === teamId) return this.myJoinRequest.status;
    return null;
  }

  leaveTeam(): void {
    if (!confirm('Bạn có chắc muốn rời đội không?')) return;
    this.leaving = true;
    this.rescueTeamService.leaveTeam().subscribe({
      next: (res) => {
        if (res.success) this.loadTeams();
        this.leaving = false;
      },
      error: () => {
        this.leaving = false;
      },
    });
  }

  get selectedTeam(): any {
    return this.teams.find((t) => t.id === this.selectedTeamId) || null;
  }

  get myTeam(): any {
    return this.teams.find((t) => t.members?.some((m: any) => m.id === this.currentUserId)) || null;
  }

  isMyTeam(team: any): boolean {
    return team.members?.some((m: any) => m.id === this.currentUserId);
  }

  isMember(member: any): boolean {
    return member.id === this.currentUserId;
  }

  getInitials(name: string): string {
    return name
      .trim()
      .split(' ')
      .map((n: string) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  }

  getHealthLabel(status: string): string {
    const map: Record<string, string> = {
      safe: 'An toàn',
      danger: 'Nguy hiểm',
      injured: 'Bị thương',
      unknown: 'Chưa rõ',
    };
    return map[status] || 'Chưa rõ';
  }

  getHealthClass(status: string): string {
    const map: Record<string, string> = {
      safe: 'health-safe',
      danger: 'health-danger',
      injured: 'health-injured',
      unknown: 'health-unknown',
    };
    return map[status] || 'health-unknown';
  }
}
