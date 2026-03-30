// app/member/discussions/new/page.tsx
'use client';

import React, { useState } from 'react';
import { Button, Card, Form, Input, Radio, Select, message } from 'antd';
import { useRouter } from 'next/navigation';
import MemberLayout from '../../_components/MemberLayout';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function DiscussionNew() {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const isTrainerOnly = roles.includes('TRAINER') && !roles.includes('JUGENDVORSTAND') && !roles.includes('GESCHAEFTSFUEHRER');

  React.useEffect(() => {
    (async () => {
      try {
        const [meRes, teamsRes] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
            credentials: 'include',
          }),
          fetch(`${API_BASE}/teams/mine`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
            credentials: 'include',
          }),
        ]);
        const me = await meRes.json().catch(() => ({}));
        const mine = await teamsRes.json().catch(() => []);
        const roleList = Array.isArray(me?.roles) ? me.roles : [];
        const mineTeams = Array.isArray(mine) ? mine : [];
        setRoles(roleList);
        setTeams(mineTeams);
        if (roleList.includes('TRAINER') && !roleList.includes('JUGENDVORSTAND') && !roleList.includes('GESCHAEFTSFUEHRER') && mineTeams.length === 1) {
          form.setFieldValue('teamId', mineTeams[0]._id);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [form, token]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      const d = await res.json();
      message.success('Diskussion erstellt');
      router.replace(`/member/discussions/${d._id}`);
    } catch (e:any) {
      message.error(e?.message ?? 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MemberLayout>
      <Card title="Neue Diskussion">
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ visibility: 'INTERNAL' }}>
          <Form.Item name="title" label="Titel" rules={[{ required: true, message: 'Titel angeben' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="Beschreibung" rules={[{ required: true, message: 'Beschreibung angeben' }]}>
            <Input.TextArea autoSize={{ minRows: 6 }} />
          </Form.Item>
          <Form.Item name="visibility" label="Sichtbarkeit">
            <Radio.Group
              options={[
                { value: 'INTERNAL', label: 'Intern (Trainer/Vorstand)' },
                { value: 'ALL', label: 'Alle (inkl. Spieler/Erz.-ber.)' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="teamId"
            label="Mannschaft (optional)"
            rules={isTrainerOnly && teams.length > 1 ? [{ required: true, message: 'Bitte Mannschaft auswählen' }] : []}
          >
            <Select
              allowClear={!isTrainerOnly}
              disabled={isTrainerOnly && teams.length === 1}
              placeholder={isTrainerOnly && teams.length > 1 ? 'Mannschaft auswählen (Pflicht)' : 'Mannschaft auswählen'}
              options={teams.map((t: any) => ({ value: t._id, label: `${t.name} (${t.ageGroup}-Jugend)` }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Erstellen</Button>
        </Form>
      </Card>
    </MemberLayout>
  );
}
