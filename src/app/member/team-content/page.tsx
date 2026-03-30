'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Form, Input, Select, Space, Typography, Upload, message } from 'antd';
import type { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import MemberLayout from '../_components/MemberLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const { Text } = Typography;
const MAX_ABOUT = 2500;
const MAX_ANNOUNCEMENT = 300;
const MAX_TRAINING = 1200;

type TeamRow = {
  _id: string;
  name: string;
  ageGroup: string;
  coaches: Array<{ _id: string; name: string }>;
  about?: string;
  shortAnnouncement?: string;
  trainingTimes?: string;
  teamPhotoUrl?: string | null;
  coachPhotos?: Array<{ index: number; label?: string; url: string }>;
};

export default function TeamContentPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [coachLabel, setCoachLabel] = useState('');
  const [form] = Form.useForm();
  const authHeaders = () => {
    const headers: Record<string, string> = {};
    if (typeof window === 'undefined') return headers;
    const token = localStorage.getItem('accessToken');
    if (!token || token === 'null' || token === 'undefined') return headers;
    headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const selected = useMemo(() => teams.find((t) => t._id === selectedId) ?? null, [teams, selectedId]);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/teams/mine`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
      if (!selectedId && Array.isArray(data) && data[0]?._id) {
        setSelectedId(data[0]._id);
      }
    } catch (e: any) {
      message.error(e?.message ?? 'Teams konnten nicht geladen werden');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    form.setFieldsValue({
      about: selected.about ?? '',
      shortAnnouncement: selected.shortAnnouncement ?? '',
      trainingTimes: selected.trainingTimes ?? '',
    });
  }, [selected, form]);

  const saveText = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const values = await form.validateFields();
      const res = await fetch(`${API_BASE}/teams/${selected._id}/content`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('Teamseite gespeichert');
      await load();
    } catch (e: any) {
      if (!e?.errorFields) message.error(e?.message ?? 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const removeTeamPhoto = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API_BASE}/teams/${selected._id}/media/team`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('Mannschaftsfoto gelöscht');
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Löschen fehlgeschlagen');
    }
  };

  const removeCoachPhoto = async (index: number) => {
    if (!selected) return;
    try {
      const res = await fetch(`${API_BASE}/teams/${selected._id}/media/coaches/${index}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('Trainerfoto gelöscht');
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Löschen fehlgeschlagen');
    }
  };

  const moveCoachPhoto = async (index: number, direction: 'up' | 'down') => {
    if (!selected) return;
    const photos = selected.coachPhotos ?? [];
    const localOrder = photos.map((p) => p.index);
    const pos = localOrder.indexOf(index);
    const swapPos = direction === 'up' ? pos - 1 : pos + 1;
    if (pos < 0 || swapPos < 0 || swapPos >= localOrder.length) return;
    [localOrder[pos], localOrder[swapPos]] = [localOrder[swapPos], localOrder[pos]];
    try {
      const res = await fetch(`${API_BASE}/teams/${selected._id}/media/coaches/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ order: localOrder }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Sortierung fehlgeschlagen');
    }
  };

  const uploadTo = (path: string, extra?: Record<string, string>) =>
    async (options: RcCustomRequestOptions) => {
      const { file, onError, onSuccess } = options;
      try {
        if (!selected) throw new Error('Bitte zuerst ein Team auswählen');
        const formData = new FormData();
        formData.append('file', file as File);
        Object.entries(extra ?? {}).forEach(([k, v]) => formData.append(k, v));

        const res = await fetch(`${API_BASE}/teams/${selected._id}/${path}`, {
          method: 'POST',
          headers: authHeaders(),
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) throw new Error(await res.text());
        onSuccess?.({});
        message.success('Bild hochgeladen');
        await load();
      } catch (e: any) {
        onError?.(e);
        message.error(e?.message ?? 'Upload fehlgeschlagen');
      }
    };

  return (
    <MemberLayout title="Mannschaftsseite" subtitle="Infos, Trainingszeiten, Ankündigungen und Fotos für deine Teams">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Select
            placeholder="Team auswählen"
            value={selectedId || undefined}
            onChange={setSelectedId}
            options={teams.map((t) => ({ value: t._id, label: `${t.name} (${t.ageGroup}-Jugend)` }))}
          />

          {!selected ? (
            <Empty description="Kein Team zugewiesen oder keine Auswahl getroffen" />
          ) : (
            <>
              <div>
                <Text strong>Trainerteam:</Text>{' '}
                <Text>{(selected.coaches ?? []).map((c) => c.name).join(', ') || 'Nicht gesetzt'}</Text>
              </div>

                <Form form={form} layout="vertical">
                <Form.Item name="about" label="Über die Mannschaft">
                  <Input.TextArea rows={4} maxLength={MAX_ABOUT} showCount placeholder="Kurzbeschreibung der Mannschaft..." />
                </Form.Item>
                <Form.Item name="shortAnnouncement" label="Kurze Ankündigung">
                  <Input.TextArea rows={2} maxLength={MAX_ANNOUNCEMENT} showCount placeholder="Aktuelle kurze Info..." />
                </Form.Item>
                <Form.Item name="trainingTimes" label="Trainingszeiten">
                  <Input.TextArea rows={3} maxLength={MAX_TRAINING} showCount placeholder="z. B. Mo 17:00-18:30 Köhlerwaldstraße 8..." />
                </Form.Item>
                <Button type="primary" onClick={saveText} loading={saving}>
                  Texte speichern
                </Button>
              </Form>

              <Card size="small" title="Mannschaftsfoto">
                {selected.teamPhotoUrl ? (
                  <img
                    src={`${API_BASE}${selected.teamPhotoUrl}`}
                    alt={`${selected.name} Mannschaftsfoto`}
                    style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, marginBottom: 10 }}
                  />
                ) : (
                  <Text type="secondary">Noch kein Mannschaftsfoto vorhanden.</Text>
                )}
                <div style={{ marginTop: 10 }}>
                  <Space>
                    <Upload showUploadList={false} customRequest={uploadTo('media/team')}>
                      <Button icon={<UploadOutlined />}>Mannschaftsfoto hochladen</Button>
                    </Upload>
                    {selected.teamPhotoUrl ? (
                      <Button danger icon={<DeleteOutlined />} onClick={removeTeamPhoto}>
                        Löschen
                      </Button>
                    ) : null}
                  </Space>
                </div>
              </Card>

              <Card size="small" title="Trainerfotos">
                <Space wrap style={{ marginBottom: 10 }}>
                  {(selected.coachPhotos ?? []).map((p) => (
                    <div key={p.index} style={{ width: 160 }}>
                      <img
                        src={`${API_BASE}${p.url}`}
                        alt={p.label || `Trainerfoto ${p.index + 1}`}
                        style={{ width: 160, height: 110, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>{p.label || 'Trainerfoto'}</div>
                      <Space size={4} style={{ marginTop: 6 }}>
                        <Button size="small" icon={<ArrowUpOutlined />} onClick={() => moveCoachPhoto(p.index, 'up')} />
                        <Button size="small" icon={<ArrowDownOutlined />} onClick={() => moveCoachPhoto(p.index, 'down')} />
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeCoachPhoto(p.index)} />
                      </Space>
                    </div>
                  ))}
                </Space>
                <Space.Compact style={{ width: 360, maxWidth: '100%', marginBottom: 8 }}>
                  <Input
                    placeholder="Name/Beschriftung (optional)"
                    value={coachLabel}
                    onChange={(e) => setCoachLabel(e.target.value)}
                  />
                </Space.Compact>
                <div>
                  <Upload showUploadList={false} customRequest={uploadTo('media/coaches', coachLabel ? { label: coachLabel } : undefined)}>
                    <Button icon={<UploadOutlined />}>Trainerfoto hochladen</Button>
                  </Upload>
                </div>
              </Card>
            </>
          )}
        </Space>
      </Card>
    </MemberLayout>
  );
}
