'use client';

import { useState } from 'react';
import { Upload, Button, Card, Typography, Space, Result, message, Form, Input, DatePicker } from 'antd';
import { InboxOutlined, FilePdfOutlined, CheckCircleTwoTone } from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;

export default function PaperUploadPage() {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [form] = Form.useForm();

  const props = {
    name: 'file',
    multiple: false,
    accept: 'application/pdf',
    showUploadList: true,
    customRequest: async (options: any) => {
      const { file, onSuccess, onError } = options;
      const values = await form.validateFields();
      const formData = new FormData();
      formData.append('file', file as File);
      formData.append('firstName', values.firstName);
      formData.append('lastName', values.lastName);
      formData.append('birthDate', values.birthDate.format('YYYY-MM-DD'));
      formData.append('contactEmail', values.contactEmail);
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/registrations/paper`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setCreatedId(data._id);
        setDetails(data);
        onSuccess(data);
        message.success('Anmeldung aus PDF erstellt.');
      } catch (e: any) {
        onError?.(e);
        message.error('Upload/Analyse fehlgeschlagen.');
      } finally {
        setLoading(false);
      }
    },
  };

  return (
    <Card style={{ maxWidth: 900, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2} style={{ marginBottom: 0 }}>
          <FilePdfOutlined /> Papier-Anmeldung hochladen
        </Title>
        <Paragraph>
          Lade hier das <strong>ausgefüllte und unterschriebene</strong> Anmeldeformular als PDF hoch.
          Unsere KI liest die Daten automatisch aus und erstellt eine Registrierung.
          So sparen wir Tipparbeit – Originale bitte <em>immer</em> beim Trainer abgeben.
        </Paragraph>

        <Form form={form} layout="vertical">
          <Form.Item label="Vorname (Spieler/in)" name="firstName" rules={[{ required: true, message: 'Vorname angeben' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Nachname (Spieler/in)" name="lastName" rules={[{ required: true, message: 'Nachname angeben' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Geburtsdatum" name="birthDate" rules={[{ required: true, message: 'Geburtsdatum wählen' }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item label="Kontakt-E-Mail Eltern" name="contactEmail" rules={[{ required: true, message: 'E-Mail angeben' }, { type: 'email', message: 'Ungültige E-Mail' }]}>
            <Input />
          </Form.Item>
        </Form>

        <Dragger {...props} disabled={!!createdId} style={{ borderRadius: 12 }}>
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">PDF hierher ziehen oder klicken</p>
          <p className="ant-upload-hint">Nur eine Datei · max. 25 MB</p>
        </Dragger>

        {createdId && (
          <Result
            status="success"
            title="Registrierung angelegt"
            subTitle={
              <>
                <div><CheckCircleTwoTone twoToneColor="#52c41a" /> ID: <Text code>{createdId}</Text></div>
                <div>Extrahierter Antrag: <Text strong>{details?.applicationExtracted ? 'ja' : 'nein'}</Text></div>
                <div>Extrahierte Geburtsurkunde: <Text strong>{details?.birthCertificateExtracted ? 'ja' : 'nein'}</Text></div>
              </>
            }
            extra={[
              <Button key="antrag" type="default" href={`${process.env.NEXT_PUBLIC_API_URL}/registrations/${createdId}/document/application`} target="_blank" disabled={!details?.applicationExtracted}>
                Antrag ansehen
              </Button>,
              <Button key="urkunde" type="default" href={`${process.env.NEXT_PUBLIC_API_URL}/registrations/${createdId}/document/birthCertificate`} target="_blank" disabled={!details?.birthCertificateExtracted}>
                Geburtsurkunde ansehen
              </Button>,
              <Button key="weiter" type="primary" href={`/new/upload/${createdId}`}>
                Weiter zum Upload-/Abschluss-Schritt
              </Button>,
            ]}
          />
        )}
      </Space>
    </Card>
  );
}
