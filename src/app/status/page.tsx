'use client';

import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, ConfigProvider, DatePicker, Form, Input, List, Result, Steps, Tag, Typography, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type SearchHit = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  createdAt: string;
  status: 'NEW' | 'WAITING_UPLOAD' | 'IN_PROGRESS' | 'WAITING_KREIS' | 'PAUSED' | 'REFUSED' | 'SUBMITTED' | 'DONE';
  isCompleted?: boolean;
};

const statusLabel: Record<SearchHit['status'], string> = {
  NEW: 'Neu',
  WAITING_UPLOAD: 'Wartet auf Upload der Unterlagen',
  IN_PROGRESS: 'In Bearbeitung',
  WAITING_KREIS: 'Warten auf Bearbeitung beim Kreis',
  PAUSED: 'Rückfragen / Bearbeitung pausiert',
  REFUSED: 'Abgelehnt',
  SUBMITTED: 'Spielberechtigung beantragt',
  DONE: 'Abgeschlossen',
};

const statusStepIndex: Record<SearchHit['status'], number> = {
  NEW: 0,
  WAITING_UPLOAD: 1,
  IN_PROGRESS: 2,
  WAITING_KREIS: 3,
  PAUSED: 4,
  REFUSED: 5,
  SUBMITTED: 6,
  DONE: 7,
};

const statusColor: Record<SearchHit['status'], string> = {
  NEW: 'default',
  WAITING_UPLOAD: 'processing',
  IN_PROGRESS: 'blue',
  WAITING_KREIS: 'orange',
  PAUSED: 'warning',
  REFUSED: 'error',
  SUBMITTED: 'geekblue',
  DONE: 'success',
};

export default function StatusPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[] | null>(null);

  const onSearch = async () => {
    try {
      const { firstName, lastName, birthDate } = await form.validateFields();
      setLoading(true);
      const d = (birthDate as Dayjs).format('YYYY-MM-DD');
      const res = await fetch(
        `${API_BASE}/registrations/status?firstName=${encodeURIComponent(firstName.trim())}&lastName=${encodeURIComponent(lastName.trim())}&birthDate=${encodeURIComponent(d)}`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data);
      if (!data?.length) {
        message.info('Keine Anmeldung mit diesen Daten gefunden.');
      }
    } catch (e: any) {
      if (!e?.errorFields) message.error(e?.message ?? 'Suche fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#033B84',
          colorInfo: '#033B84',
          colorLink: '#033B84',
          colorLinkHover: '#4871A3',
          borderRadius: 12,
        },
      }}
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <img src="/Logo.jpg" alt="S.u.S. Volmarstein 12/26 e.V. Logo" className={styles.logo} />
          <h1 className={styles.brand}>S.u.S. Volmarstein 12/26 e.V.</h1>
        </header>

        <main className={styles.main}>
          <Card className={styles.card}>
            <Title level={2} className={styles.title}>Status Mitgliedschaftsanmeldung</Title>
            <Paragraph className={styles.subtitle}>
              Bitte geben Sie <strong>Vorname</strong>, <strong>Nachname</strong> und <strong>Geburtsdatum</strong> des Spielers/der Spielerin ein.
            </Paragraph>

            <Alert
              type="info"
              showIcon
              message="Datenschutz"
              description="Wir zeigen ausschließlich den Bearbeitungsstatus und minimale Metadaten an. Keine sensiblen Daten werden offengelegt."
              style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" onFinish={onSearch}>
              <Form.Item
                label="Vorname"
                name="firstName"
                rules={[{ required: true, message: 'Bitte Vornamen eingeben' }]}
              >
                <Input placeholder="z. B. Max" />
              </Form.Item>
              <Form.Item
                label="Nachname"
                name="lastName"
                rules={[{ required: true, message: 'Bitte Nachnamen eingeben' }]}
              >
                <Input placeholder="z. B. Mustermann" />
              </Form.Item>
              <Form.Item
                label="Geburtsdatum"
                name="birthDate"
                rules={[{ required: true, message: 'Bitte Geburtsdatum auswählen' }]}
              >
                <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={loading}>
                Status anzeigen
              </Button>
            </Form>

            {/* Ergebnisse */}
            {results && (
              <>
                {!results.length ? (
                  <Result status="info" title="Keine Ergebnisse" subTitle="Bitte prüfen Sie die Eingaben oder wenden Sie sich an den Verein." />
                ) : (
                  <List
                    style={{ marginTop: 16 }}
                    itemLayout="vertical"
                    dataSource={results}
                    renderItem={(item) => {
                      const idx = statusStepIndex[item.status];
                      const color = statusColor[item.status] as any;
                      return (
                        <Card style={{ marginBottom: 12 }}>
                          <Title level={4} style={{ marginTop: 0 }}>
                            {item.firstName} {item.lastName}{' '}
                            <Tag color={color}>{statusLabel[item.status]}</Tag>
                          </Title>
                          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                            Geburtsdatum: {dayjs(item.birthDate).format('DD.MM.YYYY')} ·
                            &nbsp;Angelegt am: {dayjs(item.createdAt).format('DD.MM.YYYY')}
                          </Paragraph>

                          <Steps
                            direction="vertical"
                            size="small"
                            current={idx}
                            items={[
                                { title: 'Neu' },
                                { title: 'Unterlagen hochladen' },
                                { title: 'Vereinsprüfung' },
                                { title: 'Kreis' },
                                { title: 'Rückfragen / Pause' },
                                { title: 'Abgelehnt' },
                                { title: 'Beantragt' },
                                { title: 'Abgeschlossen' },
                            ]}
                            />

                          {item.status === 'PAUSED' && (
                            <Alert
                              type="warning"
                              showIcon
                              message="Bearbeitung pausiert"
                              description="Wir haben Rückfragen zu Ihrer Anmeldung. Bitte prüfen Sie Ihr E-Mail-Postfach oder wenden Sie sich an Ihren Trainer."
                              style={{ marginTop: 12 }}
                            />
                          )}
                          {item.status === 'REFUSED' && (
                            <Alert
                              type="error"
                              showIcon
                              message="Anmeldung abgelehnt"
                              description="Diese Anmeldung wurde abgelehnt. Bitte wenden Sie sich für Rückfragen an den Verein."
                              style={{ marginTop: 12 }}
                            />
                          )}
                        </Card>
                      );
                    }}
                  />
                )}
              </>
            )}
          </Card>
        </main>

        <footer className={styles.footer}>
          <span>© S.u.S. Volmarstein 12/26 e.V.</span>
        </footer>
      </div>
    </ConfigProvider>
  );
}
