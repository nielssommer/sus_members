// app/member/calendar/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Calendar, Card, DatePicker, Form, Input, Modal, Radio, Select, Space, Switch, Tag, TimePicker, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import MemberLayout from '../_components/MemberLayout';
const { Text } = Typography;

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Event = {
  _id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  location?: string;
  scope: 'BOARD'|'TEAM';
  teamId?: string;
  teamName?: string;
  teamAgeGroup?: string;
  showOnHomepage?: boolean;
};

function readRolesFromToken(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = token.split('.')[1];
    if (!payload) return [];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return Array.isArray(decoded?.roles) ? decoded.roles : [];
  } catch {
    return [];
  }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [value, setValue] = useState<Dayjs>(dayjs());
  const [hideMyTeamEvents, setHideMyTeamEvents] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isBoard = roles.includes('JUGENDVORSTAND') || roles.includes('GESCHAEFTSFUEHRER');
  const isTrainer = roles.includes('TRAINER');
  const isWebmaster = roles.includes('WEBMASTER');

  const load = async () => {
    const start = value.startOf('month').startOf('week');
    const end = value.endOf('month').endOf('week');
    try {
      const res = await fetch(`${API}/calendar/events?from=${start.toISOString()}&to=${end.toISOString()}${hideMyTeamEvents ? '&hideMyTeamEvents=1' : ''}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Kalender konnte nicht geladen werden');
      setEvents(await res.json());
    } catch (e:any) { message.error(e?.message ?? 'Fehler'); }
  };

  const loadTeams = async () => {
    try {
      const res = await fetch(`${API}/calendar/teams/assignable`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (res.ok) {
        const t = await res.json();
        setTeams(Array.isArray(t) ? t : []);
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
          credentials: 'include',
        });
        if (meRes.ok) {
          const me = await meRes.json();
          const fromApi = Array.isArray(me?.roles) ? me.roles : [];
          setRoles(fromApi);
          return;
        }
      } catch {}
      setRoles(readRolesFromToken(token));
    })();
  }, [token]);

  useEffect(() => { loadTeams(); /* eslint-disable-next-line */ }, [token, roles.join(',')]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [value, hideMyTeamEvents]);

  // Tages-Events
  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(ev => {
      const d = dayjs(ev.startAt).format('YYYY-MM-DD');
      (map.get(d) || map.set(d, []).get(d)!).push(ev);
    });
    return map;
  }, [events]);

  // Modal: neues Event
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const onCreate = async () => {
    try {
      const v = await form.validateFields();
      const [date, times] = [v.date as Dayjs, v.time as [Dayjs, Dayjs]];
      const startAt = v.allDay ? date.startOf('day') : dayjs(date).hour(times[0].hour()).minute(times[0].minute());
      const endAt = v.allDay ? date.endOf('day') : dayjs(date).hour(times[1].hour()).minute(times[1].minute());

      const payload: any = {
        title: v.title,
        description: v.description || undefined,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        allDay: !!v.allDay,
        location: v.location || undefined,
        scope: v.scope,
        teamId: v.scope === 'TEAM' ? v.teamId : undefined,
        showOnHomepage: !!v.showOnHomepage,
      };

      const res = await fetch(`${API}/calendar/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Event speichern fehlgeschlagen');

      message.success('Event gespeichert');
      setOpen(false);
      form.resetFields();
      load();
    } catch (e: any) {
      if (e?.errorFields) return; // Form-Fehler
      message.error(e?.message ?? 'Fehler');
    }
  };

  const allowCreateBoard = isBoard;
  const allowCreateTeam = isTrainer && teams.length > 0;
  const teamLabel = (ev: Event) => (ev.teamName ? ` (${ev.teamName})` : '');
  const trainerTeamIds = useMemo(() => new Set(teams.map((t: any) => String(t._id))), [teams]);
  const canDeleteEvent = (ev: Event | null) => {
    if (!ev) return false;
    if (isBoard) return true;
    return isTrainer && ev.scope === 'TEAM' && !!ev.teamId && trainerTeamIds.has(String(ev.teamId));
  };

  const openEventDetail = (ev: Event) => {
    setSelectedEvent(ev);
    setDetailOpen(true);
  };

  const deleteEvent = async () => {
    if (!selectedEvent) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/calendar/events/${selectedEvent._id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('Termin gelöscht');
      setDetailOpen(false);
      setSelectedEvent(null);
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Löschen fehlgeschlagen');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MemberLayout
      title="Kalender"
      subtitle="Vorstandstermine & Mannschaftstermine"
      extra={
        <Space>
          {isBoard && isTrainer && (
            <Space>
              <span style={{ color: '#fff' }}>Eigene Teamtermine ausblenden</span>
              <Switch checked={hideMyTeamEvents} onChange={setHideMyTeamEvents} />
            </Space>
          )}
          {(allowCreateBoard || allowCreateTeam) && (
            <Button
              type="primary"
              onClick={() => {
                const initialScope = allowCreateBoard ? 'BOARD' : 'TEAM';
                form.setFieldsValue({
                  date: value,
                  allDay: false,
                  scope: initialScope,
                  teamId: initialScope === 'TEAM' && teams.length === 1 ? teams[0]._id : undefined,
                });
                setOpen(true);
              }}
            >
              Neuer Termin
            </Button>
          )}
        </Space>
      }
    >
      <Card style={{ borderRadius: 14 }}>
        <Space style={{ marginBottom: 12 }} wrap>
          <Tag color="processing">Vorstandstermin</Tag>
          <Tag color="success">Mannschaftstermin</Tag>
        </Space>
        <Calendar
          value={value}
          onSelect={setValue}
          onPanelChange={setValue as any}
          dateCellRender={(d) => {
            const key = d.format('YYYY-MM-DD');
            const evs = eventsByDay.get(key) || [];
            return (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {evs.slice(0, 3).map((ev) => (
                  <li key={ev._id} style={{ marginBottom: 2, cursor: 'pointer' }} onClick={() => openEventDetail(ev)}>
                    <Badge
                      status={ev.scope === 'BOARD' ? 'processing' : 'success'}
                      text={
                        <span title={ev.title} style={{ fontSize: 12 }}>
                          {dayjs(ev.startAt).format('HH:mm')} {ev.title}{ev.scope === 'TEAM' ? teamLabel(ev) : ''}
                        </span>
                      }
                    />
                  </li>
                ))}
                {evs.length > 3 && <li style={{ fontSize: 12, color: '#999' }}>+{evs.length - 3} weitere</li>}
              </ul>
            );
          }}
        />
      </Card>

      <Modal
        title="Neuer Termin"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onCreate}
        okText="Speichern"
      >
        <Form form={form} layout="vertical" initialValues={{ allDay: false }}>
          <Form.Item name="title" label="Titel" rules={[{ required: true, message: 'Bitte Titel angeben' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Beschreibung">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="location" label="Ort">
            <Input />
          </Form.Item>

          <Form.Item name="date" label="Datum" rules={[{ required: true, message: 'Bitte Datum wählen' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.allDay !== cur.allDay}>
            {({ getFieldValue }) =>
              !getFieldValue('allDay') ? (
                <Form.Item
                  name="time"
                  label="Zeit"
                  rules={[{ required: true, message: 'Bitte Zeit wählen' }]}
                >
                  <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="allDay" label="Ganztägig" valuePropName="checked">
            <Switch />
          </Form.Item>

          {isWebmaster ? (
            <Form.Item name="showOnHomepage" label="Auf Homepage anzeigen" valuePropName="checked">
              <Switch />
            </Form.Item>
          ) : null}

          {(allowCreateBoard || allowCreateTeam) && (
            <Form.Item name="scope" label="Sichtbarkeit">
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={[
                  ...(allowCreateBoard ? [{ label: 'Jugendvorstand', value: 'BOARD' as const }] : []),
                  ...(allowCreateTeam ? [{ label: 'Mannschaft', value: 'TEAM' as const }] : []),
                ]}
              />
            </Form.Item>
          )}

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.scope !== cur.scope}>
            {({ getFieldValue }) =>
              getFieldValue('scope') === 'TEAM' ? (
                <Form.Item name="teamId" label="Mannschaft" rules={[{ required: true, message: 'Team auswählen' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={teams.map((t: any) => ({ value: t._id, label: `${t.name} (${t.ageGroup}-Jugend)` }))}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Termin-Details"
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setSelectedEvent(null); }}
        footer={[
          <Button key="close" onClick={() => { setDetailOpen(false); setSelectedEvent(null); }}>
            Schließen
          </Button>,
          ...(canDeleteEvent(selectedEvent) ? [
            <Button
              key="delete"
              danger
              loading={deleting}
              onClick={() => {
                if (window.confirm('Termin wirklich löschen?')) deleteEvent();
              }}
            >
              Löschen
            </Button>,
          ] : []),
        ]}
      >
        {selectedEvent ? (
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Text><b>Titel:</b> {selectedEvent.title}</Text>
            <Text><b>Sichtbarkeit:</b> {selectedEvent.scope === 'BOARD' ? 'Jugendvorstand' : 'Mannschaft'}</Text>
            {selectedEvent.scope === 'TEAM' ? (
              <Text><b>Mannschaft:</b> {selectedEvent.teamName ?? '—'}</Text>
            ) : null}
            <Text><b>Homepage:</b> {selectedEvent.showOnHomepage ? 'Ja' : 'Nein'}</Text>
            <Text><b>Beginn:</b> {dayjs(selectedEvent.startAt).format('DD.MM.YYYY HH:mm')}</Text>
            <Text><b>Ende:</b> {dayjs(selectedEvent.endAt).format('DD.MM.YYYY HH:mm')}</Text>
            {selectedEvent.location ? <Text><b>Ort:</b> {selectedEvent.location}</Text> : null}
            {selectedEvent.description ? <Text><b>Beschreibung:</b> {selectedEvent.description}</Text> : null}
          </Space>
        ) : null}
      </Modal>
    </MemberLayout>
  );
}
