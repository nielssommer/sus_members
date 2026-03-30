'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import MemberLayout from '../_components/MemberLayout';

const { Text } = Typography;
const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const ROLES = ['SPIELER','ERZIEHUNGSBERECHTIGTER','TRAINER','JUGENDVORSTAND','GESCHAEFTSFUEHRER','WEBMASTER'] as const;

function formatBirthDate(value?: string) {
  if (!value) return '—';
  const iso = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE');
}

export default function UsersAdminPage() {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [teamFilter, setTeamFilter] = useState<string | undefined>();
  const [rows, setRows] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (teamFilter) params.set('teamId', teamFilter);

      const [u, t] = await Promise.all([
        fetch(`${API}/admin/users?${params.toString()}`, { credentials:'include' }),
        fetch(`${API}/teams`, { credentials:'include' }),
      ]);
      const users = (await u.json())?.users ?? [];
      const tm = await t.json();
      setRows(users);
      setTeams(Array.isArray(tm) ? tm : (tm?.teams ?? []));
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const setRoles = async (id: string, roles: string[]) => {
    try {
      const res = await fetch(`${API}/admin/users/${id}/roles`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ roles }),
      });
    if (!res.ok) throw new Error('Rollen speichern fehlgeschlagen');
      message.success('Rollen gespeichert');
      load();
    } catch (e:any) { message.error(e?.message ?? 'Fehler'); }
  };

  const setTeamsFn = async (id: string, teamIds: string[]) => {
    try {
      const res = await fetch(`${API}/admin/users/${id}/teams`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ teamIds }),
      });
      if (!res.ok) throw new Error('Teams speichern fehlgeschlagen');
      message.success('Teams gespeichert');
      load();
    } catch (e:any) { message.error(e?.message ?? 'Fehler'); }
  };

  const removeUser = async (id: string, name?: string) => {
    Modal.confirm({
      title: 'Benutzer löschen?',
      content: `Soll ${name || 'dieser Benutzer'} wirklich gelöscht werden?`,
      okText: 'Löschen',
      okButtonProps: { danger: true },
      cancelText: 'Abbrechen',
      onOk: async () => {
        try {
          const res = await fetch(`${API}/admin/users/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error('Löschen fehlgeschlagen');
          message.success('Benutzer gelöscht');
          load();
        } catch (e: any) {
          message.error(e?.message ?? 'Fehler');
        }
      },
    });
  };

  return (
    <MemberLayout
      title="Benutzerverwaltung"
      subtitle="Rollen vergeben und Mannschaften zuweisen (nur Geschäftsführer)"
      extra={
        <Space>
          <Input
            placeholder="Suche Name/E-Mail"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onPressEnter={load}
            style={{ width: 240 }}
          />
          <Select
            allowClear
            placeholder="Rolle filtern"
            value={roleFilter}
            onChange={(v) => setRoleFilter(v)}
            style={{ width: 210 }}
            options={ROLES.map((role) => ({ value: role, label: role }))}
          />
          <Select
            allowClear
            placeholder="Mannschaft filtern"
            value={teamFilter}
            onChange={(v) => setTeamFilter(v)}
            style={{ width: 260 }}
            options={teams.map((t: any) => ({ value: t._id, label: `${t.name} (${t.ageGroup}-Jugend)` }))}
            showSearch
            optionFilterProp="label"
          />
          <Button onClick={load}>Suchen</Button>
        </Space>
      }
    >
      <Card style={{ borderRadius: 14 }}>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          columns={[
            { title: 'Name', dataIndex: 'name', render: (v: string) => v || <Text type="secondary">—</Text> },
            { title: 'E-Mail', dataIndex: 'email' },
            {
              title: 'Geburtsdatum',
              render: (_: any, r: any) => formatBirthDate(r.birthDate),
              width: 140,
            },
            {
              title: 'Rollen',
              render: (_: any, r: any) => (
                <Space wrap>
                  <Select
                    mode="multiple"
                    value={r.roles ?? []}
                    onChange={(vals) => setRoles(r._id, vals as string[])}
                    style={{ minWidth: 280 }}
                    options={ROLES.map((role) => ({ value: role, label: role }))}
                    tagRender={(tagProps) => {
                      const color =
                        tagProps.value === 'GESCHAEFTSFUEHRER' ? 'magenta' :
                        tagProps.value === 'JUGENDVORSTAND' ? 'orange' :
                        tagProps.value === 'TRAINER' ? 'geekblue' : 'default';
                      return <Tag color={color} closable={tagProps.closable} onClose={tagProps.onClose}>{tagProps.value}</Tag>;
                    }}
                  />
                </Space>
              ),
            },
            {
              title: 'Mannschaften',
              render: (_: any, r: any) => (
                <Select
                  mode="multiple"
                  style={{ minWidth: 320 }}
                  value={(r.teamIds ?? []).map(String)}
                  onChange={(vals) => setTeamsFn(r._id, vals as string[])}
                  options={teams.map((t: any) => ({ value: t._id, label: `${t.name} (${t.ageGroup}-Jugend)` }))}
                  showSearch
                  optionFilterProp="label"
                />
              ),
            },
            {
              title: 'Aktionen',
              width: 120,
              render: (_: any, r: any) => (
                <Button danger onClick={() => removeUser(r._id, r.name)}>
                  Löschen
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </MemberLayout>
  );
}
