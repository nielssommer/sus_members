'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, Button, Card, Empty, List, Modal, Select, Space, Tag, Typography, message } from 'antd';
import MemberLayout from '../_components/MemberLayout';

const { Text } = Typography;
const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type ReqItem = {
  _id: string;
  requestedRole: 'SPIELER' | 'ERZIEHUNGSBERECHTIGTER';
  note?: string;
  createdAt: string;
  user?: { _id: string; name?: string; email?: string; birthDate?: string };
  team?: { _id: string; name: string; ageGroup: string };
  teamId?: string; // falls nicht populated
};

type ApprovalRole = 'SPIELER' | 'ERZIEHUNGSBERECHTIGTER' | 'TRAINER' | 'JUGENDVORSTAND';

const roleLabel: Record<ReqItem['requestedRole'], string> = {
  SPIELER: 'Spieler/in',
  ERZIEHUNGSBERECHTIGTER: 'Erziehungsberechtigte/r',
};

const approvalRoleOptions: { value: ApprovalRole; label: string }[] = [
  { value: 'SPIELER', label: 'Spieler/in' },
  { value: 'ERZIEHUNGSBERECHTIGTER', label: 'Erziehungsberechtigte/r' },
  { value: 'TRAINER', label: 'Trainer/in' },
  { value: 'JUGENDVORSTAND', label: 'Jugendvorstand' },
];

const roleNeedsTeam = (role: ApprovalRole) =>
  role === 'SPIELER' || role === 'ERZIEHUNGSBERECHTIGTER' || role === 'TRAINER';

export default function RequestsPage() {
  const [items, setItems] = useState<ReqItem[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API}/membership-requests`, { credentials: 'include' }),
        fetch(`${API}/teams`, { credentials: 'include' }),
        fetch(`${API}/auth/me`, { credentials: 'include' }),
      ]);
      if (!r1.ok) throw new Error('Laden fehlgeschlagen');
      const reqs = await r1.json();
      const tm = await r2.json().catch(() => ({}));
      const me = await r3.json().catch(() => ({}));
      setItems(Array.isArray(reqs) ? reqs : []);
      setTeams(Array.isArray(tm) ? tm : (tm?.teams ?? []));
      setCurrentRoles(Array.isArray(me?.roles) ? me.roles : []);
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (req: ReqItem) => {
    const isManager = currentRoles.includes('GESCHAEFTSFUEHRER');
    const isTrainerOnly = currentRoles.includes('TRAINER') && !currentRoles.includes('JUGENDVORSTAND') && !isManager;
    const selectableRoles = approvalRoleOptions.filter((o) => {
      if (isManager) return true;
      if (isTrainerOnly) return o.value === 'SPIELER' || o.value === 'ERZIEHUNGSBERECHTIGTER';
      return o.value !== 'JUGENDVORSTAND';
    });
    const preselectedTeamId = req.team?._id ?? req.teamId;
    const preselectedRole = (selectableRoles.some((o) => o.value === req.requestedRole)
      ? req.requestedRole
      : selectableRoles[0]?.value ?? 'SPIELER') as ApprovalRole;
    const approval = await new Promise<{ approvedRole: ApprovalRole; teamId?: string } | undefined>((resolve) => {
      let selectedRole: ApprovalRole = preselectedRole;
      let selectedTeamId: string | undefined = preselectedTeamId;
      Modal.confirm({
        title: 'Freigabe konfigurieren',
        content: (
          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
            <div>
              <Text type="secondary">Rolle nach Freigabe</Text>
              <Select
                style={{ width: '100%', marginTop: 6 }}
                defaultValue={selectedRole}
                options={selectableRoles}
                onChange={(v) => (selectedRole = v as ApprovalRole)}
              />
            </div>
            <div>
              <Text type="secondary">Mannschaft (für Spieler/Erziehungsberechtigte/Trainer erforderlich)</Text>
              <Select
                style={{ width: '100%', marginTop: 6 }}
                allowClear={!isTrainerOnly}
                disabled={isTrainerOnly}
                placeholder="Team auswählen"
                defaultValue={selectedTeamId}
                options={teams.map((t: any) => ({ value: t._id, label: `${t.name} (${t.ageGroup}-Jugend)` }))}
                onChange={(v) => (selectedTeamId = v)}
              />
            </div>
          </Space>
        ),
        onOk: () => resolve({ approvedRole: selectedRole, teamId: selectedTeamId }),
        onCancel: () => resolve(undefined),
      });
    });
    if (!approval) return;
    if (roleNeedsTeam(approval.approvedRole) && !approval.teamId) {
      message.error('Für diese Rolle muss eine Mannschaft ausgewählt werden.');
      return;
    }

    try {
      const res = await fetch(`${API}/membership-requests/${req._id}/decision`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'APPROVED',
          teamId: approval.teamId,
          approvedRole: approval.approvedRole,
        }),
      });
      if (!res.ok) throw new Error('Freigabe fehlgeschlagen');
      message.success('Freigabe gespeichert');
      load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler');
    }
  };

  const reject = async (req: ReqItem) => {
    try {
      const res = await fetch(`${API}/membership-requests/${req._id}/decision`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'REJECTED' }),
      });
      if (!res.ok) throw new Error('Ablehnung fehlgeschlagen');
      message.success('Abgelehnt');
      load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler');
    }
  };

  return (
    <MemberLayout
      title="Anfragen"
      subtitle="Registrierungsanfragen prüfen und freigeben"
    >
      <Card style={{ borderRadius: 14 }}>
        <List
          loading={loading}
          dataSource={items}
          locale={{ emptyText: <Empty description="Keine offenen Anfragen" /> }}
          renderItem={(it) => {
            const name = it.user?.name ?? it.user?.email ?? 'Unbekannt';
            const email = it.user?.email ?? '';
            const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

            return (
              <List.Item
                actions={[
                  <Button key="approve" type="primary" onClick={() => approve(it)}>Freigeben</Button>,
                  <Button key="reject" danger onClick={() => reject(it)}>Ablehnen</Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ background: 'var(--sus-primary)' }}>{initials || 'U'}</Avatar>}
                  title={
                    <Space wrap>
                      <Text strong>{name}</Text>
                      {email && <Text type="secondary">{email}</Text>}
                      {it.user?.birthDate && (
                        <Tag color="purple">{new Date(it.user.birthDate).toLocaleDateString()}</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space wrap>
                      <Tag color="blue">{roleLabel[it.requestedRole]}</Tag>
                      <Tag>{it.team?.name ? `${it.team.name} (${it.team.ageGroup}-Jugend)` : 'kein Team gewählt'}</Tag>
                      <Text type="secondary">{new Date(it.createdAt).toLocaleString()}</Text>
                    </Space>
                  }
                />
                <div style={{ maxWidth: 520 }}>
                  <Text type="secondary">Bemerkung:</Text> {it.note || '—'}
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
    </MemberLayout>
  );
}
