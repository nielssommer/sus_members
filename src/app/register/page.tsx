'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { useRouter } from 'next/navigation';
import { TeamOutlined, MailOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function RegisterPage() {
  const [form] = Form.useForm();
  const [teams, setTeams] = useState<{ _id: string; name: string; ageGroup: string }[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/teams`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTeams(Array.isArray(data) ? data : data?.teams ?? []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingTeams(false);
      }
    })();
  }, []);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        birthDate: (values.birthDate as Dayjs).format('YYYY-MM-DD'),
        role: values.role,
        teamId: values.teamId || undefined,
        note: values.note || undefined,
      };

      const res = await fetch(`${API_BASE}/membership-requests/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Registrierung fehlgeschlagen');
      }

      message.success(
        payload.teamId
          ? 'Registriert! Dein/e Trainer/in sieht die Anfrage und kann dich freigeben.'
          : 'Registriert! Die Geschäftsführung ordnet dich zu.'
      );
      router.replace('/login');
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="susTheme" style={{ minHeight: '100dvh', background: 'var(--sus-bg, #f6f7fb)' }}>
      <main style={{ maxWidth: 1120, margin: '24px auto', padding: '0 16px' }}>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--sus-primary) 0%, var(--sus-primary-700) 100%)',
            color: 'white',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <img
            src="/Logo.jpg"
            alt="S.u.S. Volmarstein 12/26 e.V."
            style={{ width: 72, height: 72, objectFit: 'contain', background: 'white', borderRadius: 12, padding: 6 }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <Title level={3} style={{ color: 'black', margin: 0 }}>
              Neu registrieren
            </Title>
            <Text style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
              Zugang zum Mitgliederbereich
            </Text>
          </div>
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={14}>
            <Card
              style={{ borderRadius: 14 }}
              headStyle={{ borderBottom: 'none' }}
              title={<span style={{ color: 'var(--sus-primary-700)' }}>Deine Angaben</span>}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ role: 'SPIELER' }}
                requiredMark="optional"
              >
                <Form.Item
                  name="name"
                  label="Name"
                  rules={[{ required: true, message: 'Bitte Name angeben' }]}
                >
                  <Input size="large" prefix={<UserOutlined />} placeholder="Vor- und Nachname" />
                </Form.Item>

                <Form.Item
                  name="birthDate"
                  label="Geburtsdatum"
                  rules={[{ required: true, message: 'Bitte Geburtsdatum angeben' }]}
                >
                  <DatePicker style={{ width: '100%' }} size="large" format="DD.MM.YYYY" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="E-Mail"
                  rules={[{ required: true, type: 'email', message: 'Bitte gültige E-Mail angeben' }]}
                >
                  <Input size="large" prefix={<MailOutlined />} placeholder="name@beispiel.de" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Passwort"
                  rules={[
                    { required: true, message: 'Bitte Passwort angeben' },
                    { min: 8, message: 'Mindestens 8 Zeichen' },
                  ]}
                >
                  <Input.Password size="large" placeholder="Mindestens 8 Zeichen" />
                </Form.Item>

                <Form.Item
                  name="passwordConfirm"
                  label="Passwort wiederholen"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Bitte Passwort wiederholen' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Passwörter stimmen nicht überein'));
                      },
                    }),
                  ]}
                >
                  <Input.Password size="large" placeholder="Passwort wiederholen" />
                </Form.Item>

                <Form.Item name="role" label="Ich bin">
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                      { label: 'Spieler/in', value: 'SPIELER' },
                      { label: 'Erziehungsberechtigte/r', value: 'ERZIEHUNGSBERECHTIGTER' },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="teamId" label="Mannschaft (optional)">
                  <Select
                    size="large"
                    allowClear
                    loading={loadingTeams}
                    placeholder="Mannschaft wählen (optional)"
                    options={teams.map((t) => ({
                      value: t._id,
                      label: `${t.name} (${t.ageGroup}-Jugend)`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                    suffixIcon={<TeamOutlined />}
                  />
                </Form.Item>

                <Form.Item name="note" label="Bemerkung (optional)">
                  <Input.TextArea
                    placeholder="z. B. bisherige Position, Trainingszeiten, besondere Hinweise …"
                    autoSize={{ minRows: 3, maxRows: 6 }}
                  />
                </Form.Item>

                <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={() => form.resetFields()}>Zurücksetzen</Button>
                  <Button type="primary" size="large" htmlType="submit" loading={saving}>
                    Registrieren
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>

          <Col xs={24} md={10}>
            <Card style={{ borderRadius: 14 }} title="Informationen">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message="Ablauf"
                  description={
                    <div>
                      <p style={{ marginBottom: 8 }}>
                        • Wähle optional deine Mannschaft – dein/e Trainer/in bestätigt deine Zugehörigkeit.
                      </p>
                      <p style={{ marginBottom: 8 }}>
                        • Ohne Mannschaft geht die Anfrage an die Geschäftsführung zur Zuordnung.
                      </p>
                      <p style={{ marginBottom: 0 }}>
                        • Rolle (Spieler/in oder Erziehungsberechtigte/r) wird ebenfalls bestätigt.
                      </p>
                    </div>
                  }
                />
                <div
                  style={{
                    padding: 12,
                    border: '1px dashed var(--sus-primary-300)',
                    borderRadius: 10,
                    background: 'var(--sus-primary-25)',
                  }}
                >
                  <Title level={5} style={{ marginTop: 0, color: 'var(--sus-primary-700)' }}>
                    Datenschutz
                  </Title>
                  <Paragraph style={{ marginBottom: 0 }}>
                    Deine Angaben werden ausschließlich zur Verwaltung deiner Mitgliedschaft genutzt. Weitere Details
                    findest du in unseren Datenschutz-Hinweisen.
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
}
