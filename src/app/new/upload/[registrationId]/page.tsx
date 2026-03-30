'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Divider,
  Flex,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import {
  InboxOutlined,
  DownloadOutlined,
  CheckCircleTwoTone,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { CheckType, TypeOfApplication } from '@/models/enums.model';

const { Title, Paragraph, Text } = Typography;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type RegMeta = {
  _id: string;
  firstName?: string;
  lastName?: string;
  isCompleted?: boolean;
  eligibilityToPlay?: {
    typeOfApplication?: TypeOfApplication;
    typeOfCheck?: CheckType;
  };
  signedApplication?: { filename: string; size: number; uploadedAt: string } | null;
  birthCertificate?: { filename: string; size: number; uploadedAt: string } | null;
  additionalDocuments?: Array<{ filename: string; size: number; uploadedAt: string; contentType?: string }> | null;
};

export default function UploadSignedPage() {
  const params = useParams<{ registrationId: string }>();
  const registrationId = useMemo(() => params?.registrationId as string, [params]);

  const [meta, setMeta] = useState<RegMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadedOnce, setDownloadedOnce] = useState(false);

  const fetchMeta = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/registrations/${registrationId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMeta(data);
    } catch (e: any) {
      message.error(e?.message ?? 'Konnte Registrierungsdaten nicht laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (registrationId) fetchMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`${API_BASE}/registrations/${registrationId}/pdf`, { method: 'GET' });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `antrag-${registrationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadedOnce(true);
    } catch (e: any) {
      message.error(e?.message ?? 'PDF-Download fehlgeschlagen.');
    } finally {
      setDownloading(false);
    }
  };

  const uploadTo = (path: 'upload-signed-application' | 'upload-birth-certificate' | 'upload-additional-document') =>
    async (options: RcCustomRequestOptions) => {
      const { file, onProgress, onError, onSuccess } = options;
      try {
        const form = new FormData();
        form.append('file', file as File);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/registrations/${registrationId}/${path}`);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && onProgress) {
            onProgress({ percent: (evt.loaded / evt.total) * 100 });
          }
        };
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onSuccess?.(xhr.response);
            message.success('Upload erfolgreich.');
            setDownloadedOnce(false);
            await fetchMeta();
          } else {
            const errMsg = xhr.responseText || `Upload fehlgeschlagen (${xhr.status})`;
            onError?.(new Error(errMsg));
            message.error(errMsg);
          }
        };
        xhr.onerror = () => {
          onError?.(new Error('Netzwerkfehler'));
          message.error('Netzwerkfehler beim Upload.');
        };
        xhr.send(form);
      } catch (err) {
        onError?.(err as any);
      }
    };

  const type = meta?.eligibilityToPlay?.typeOfApplication;
  const check = meta?.eligibilityToPlay?.typeOfCheck;

  // Steuerlogik
  const needsDownload =
    (type === TypeOfApplication.FIRST_ISSUE &&
      (check === CheckType.CERTIFICATION_BY_OFFICE || check === CheckType.COPY_OF_BIRTH_CERTIFICATE)) ||
    (type !== TypeOfApplication.FIRST_ISSUE);

  const needsSignedApplication =
    (type === TypeOfApplication.FIRST_ISSUE &&
      (check === CheckType.CERTIFICATION_BY_OFFICE || check === CheckType.COPY_OF_BIRTH_CERTIFICATE)) ||
    (type !== TypeOfApplication.FIRST_ISSUE);

  const needsBirthCertificate =
    type === TypeOfApplication.FIRST_ISSUE &&
    (check === CheckType.BIRTH_CERTIFICATE || check === CheckType.COPY_OF_BIRTH_CERTIFICATE);

  const completed = !!meta?.isCompleted;
  const hasSigned = !!meta?.signedApplication;
  const hasBC = !!meta?.birthCertificate;
  const additionalDocuments = meta?.additionalDocuments ?? [];

  const canUploadSigned =
    !completed && needsSignedApplication && (!needsDownload || downloadedOnce) && !hasSigned;
  const canUploadBC =
    !completed &&
    needsBirthCertificate &&
    (!needsDownload || downloadedOnce || check === CheckType.BIRTH_CERTIFICATE) &&
    !hasBC;

  // ––––– Beschreibungsbausteine –––––

  const WhyOriginals = (
    <Alert
      type="info"
      showIcon
      message="Wichtiger Hinweis zu Originalen"
      description={
        <div>
          <p style={{ marginBottom: 8 }}>
            Bitte geben Sie <strong>alle Originale beim Trainer</strong> ab. Der Upload dient nur dazu,
            den Ablauf zu <strong>beschleunigen</strong> (Vorlauf für Prüfung und Passbeantragung).
            Die Originale werden beim Verein zu <strong>Dokumentationszwecken</strong> abgelegt.
          </p>
        </div>
      }
      style={{ marginBottom: 16 }}
      icon={<InfoCircleOutlined />}
    />
  );

  const CommonUploadHints = (
    <Alert
      type="info"
      showIcon
      message="Upload-Hinweise"
      description={
        <div>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>Max. Dateigröße: 10&nbsp;MB</li>
            <li>Dateiformate:
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li><strong>Antrag</strong>: PDF</li>
                <li><strong>Geburtsurkunde</strong>: PDF oder gut lesbares Foto (JPG/PNG)</li>
              </ul>
            </li>
            <li>Dokument vollständig und <strong>lesbar</strong> (keine abgeschnittenen Ränder, gute Auflösung)</li>
            <li>Bei Fotos: gleichmäßiges Licht, keine Spiegelungen, gerade Aufsicht</li>
          </ul>
        </div>
      }
      style={{ marginBottom: 16, background: '#fafafa' }}
    />
  );

  const DescriptionFirstIssueBirthCert = (
    <>
      <Title level={4} style={{ marginTop: 0 }}>Erstausstellung – Beglaubigte Kopie der Geburtsurkunde</Title>
      <Paragraph>
        <strong>Was ist zu tun?</strong>
      </Paragraph>
      <ul>
        <li><strong>Kein</strong> PDF-Download notwendig.</li>
        <li>Laden Sie eine <strong>beglaubigte Kopie Ihrer Geburtsurkunde</strong> hoch.</li>
      </ul>
      <Paragraph>
        <strong>Warum?</strong><br />
        Die beglaubigte Kopie dient der <strong>alters- und identitätsbezogenen Prüfung</strong> für die Spielberechtigung.
        Ohne diesen Nachweis dürfen wir keinen Spielerpass beantragen.
      </Paragraph>
      <Alert
        type="warning"
        showIcon
        message="Was bedeutet „beglaubigt“?"
        description="Die Kopie wurde von einer offiziellen Stelle (z. B. Bürgerbüro) mit Stempel, Datum und Unterschrift bestätigt. Achten Sie darauf, dass Stempel und Unterschrift klar zu erkennen sind."
        style={{ marginBottom: 16 }}
      />
    </>
  );

  const DescriptionFirstIssueCertByOffice = (
    <>
      <Title level={4} style={{ marginTop: 0 }}>Erstausstellung – Beglaubigte Kopie des Antrags</Title>
      <Paragraph>
        <strong>Was ist zu tun?</strong>
      </Paragraph>
      <ol>
        <li>PDF <strong>herunterladen</strong> (enthält Ihre Daten).</li>
        <li>PDF <strong>ausdrucken &amp; unterschreiben</strong>.</li>
        <li>Mit dem Antrag zum <strong>Bürgerbüro/Einwohnermeldeamt</strong> – dort <strong>beglaubigen</strong> lassen.</li>
        <li>Beglaubigten Antrag als <strong>PDF hochladen</strong>.</li>
      </ol>
      <Paragraph>
        <strong>Warum?</strong><br />
        Mit der amtlichen Beglaubigung bestätigt eine öffentliche Stelle die <strong>Richtigkeit Ihrer Angaben</strong>.
        Das ist für die zügige Ausstellung der Spielberechtigung erforderlich.
      </Paragraph>
    </>
  );

  const DescriptionFirstIssueCopyOfBirthCert = (
    <>
      <Title level={4} style={{ marginTop: 0 }}>Erstausstellung – Kopie der Geburtsurkunde</Title>
      <Paragraph>
        <strong>Was ist zu tun?</strong>
      </Paragraph>
      <ol>
        <li>PDF <strong>herunterladen</strong> (enthält Ihre Daten).</li>
        <li>PDF <strong>ausdrucken &amp; unterschreiben</strong>.</li>
        <li><strong>Zwei Uploads</strong> durchführen:
          <ul style={{ marginTop: 6 }}>
            <li><strong>Unterschriebener Antrag (PDF)</strong></li>
            <li><strong>Kopie der Geburtsurkunde (PDF/Bild)</strong></li>
          </ul>
        </li>
      </ol>
      <Alert
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        message="Bearbeitungszeit: 6–8 Wochen"
        description="Bei dieser Option muss die Geburtsurkunde postalisch zur Beglaubigung an den Verband. Rechnen Sie mit 6–8 Wochen Bearbeitungszeit."
        style={{ marginBottom: 16 }}
      />
      <Paragraph>
        <strong>Warum?</strong><br />
        Ohne direkte Beglaubigung dauert die Prüfung länger, da die Unterlagen <strong>zusätzlich</strong> über den Verband bestätigt werden müssen.
      </Paragraph>
    </>
  );

  const DescriptionDefaultOther = (
    <>
      <Title level={4} style={{ marginTop: 0 }}>Unterlagen zur Spielberechtigung</Title>
      <Paragraph>
        In Ihrem Fall ist der <strong>Download des vorausgefüllten PDF</strong> erforderlich. Bitte
        <strong> unterschreiben</strong> Sie den Antrag (und lassen ihn – falls angezeigt – beglaubigen) und laden Sie ihn anschließend als <strong>PDF</strong> hoch.
      </Paragraph>
    </>
  );

  const renderFlowDescription = () => {
    if (type === TypeOfApplication.FIRST_ISSUE && check === CheckType.BIRTH_CERTIFICATE) {
      return DescriptionFirstIssueBirthCert;
    }
    if (type === TypeOfApplication.FIRST_ISSUE && check === CheckType.CERTIFICATION_BY_OFFICE) {
      return DescriptionFirstIssueCertByOffice;
    }
    if (type === TypeOfApplication.FIRST_ISSUE && check === CheckType.COPY_OF_BIRTH_CERTIFICATE) {
      return DescriptionFirstIssueCopyOfBirthCert;
    }
    return DescriptionDefaultOther;
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#033B84',
          colorInfo: '#033B84',
          colorLink: '#033B84',
          colorLinkHover: '#4871A3',
          borderRadius: 10,
        },
      }}
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <img src="/Logo.jpg" alt="S.u.S. Volmarstein 12/26 e.V. Logo" className={styles.logo} />
          <h1 className={styles.brand}>S.u.S. Volmarstein 12/26 e.V.</h1>
        </header>

        <main className={styles.main}>
          <Card className={styles.card} loading={loading}>
            <Title level={2} className={styles.title}>Abschluss – Unterlagen</Title>
            <Paragraph className={styles.subtitle}>
              Registrierung:&nbsp;<Text strong>{meta?.firstName} {meta?.lastName}</Text>
            </Paragraph>

            {WhyOriginals}

            {renderFlowDescription()}

            {CommonUploadHints}

            {/* Download nur wenn nötig */}
            {needsDownload && (
              <Flex gap={12} align="center" wrap style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  loading={downloading}
                >
                  PDF mit Daten herunterladen
                </Button>
                {downloadedOnce && (
                  <Text type="success">
                    <CheckCircleTwoTone twoToneColor="#52c41a" /> PDF heruntergeladen – Upload ist freigeschaltet.
                  </Text>
                )}
              </Flex>
            )}

            {/* Antrag-Upload */}
            {needsSignedApplication && (
              <Card size="small" style={{ marginBottom: 16 }} title="Unterschriebener / beglaubigter Antrag">
                {!hasSigned ? (
                  <>
                    <Paragraph>
                      <strong>Bitte laden Sie hier den unterschriebenen (und ggf. beglaubigten) Antrag als PDF hoch.</strong><br />
                      Das Feld ist aus Datenschutzgründen auf PDF beschränkt.
                    </Paragraph>
                    {!downloadedOnce && needsDownload && (
                      <Alert
                        type="warning"
                        showIcon
                        message="Zuerst herunterladen"
                        description="Bitte laden Sie das PDF zunächst herunter. Danach wird der Upload freigeschaltet."
                        style={{ marginBottom: 12 }}
                      />
                    )}
                    <Upload.Dragger
                      name="file"
                      multiple={false}
                      accept="application/pdf"
                      customRequest={uploadTo('upload-signed-application')}
                      disabled={!canUploadSigned}
                      showUploadList={false}
                      className={!canUploadSigned && !hasSigned ? styles.locked : undefined}
                    >
                      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                      <p className="ant-upload-text">Datei hierher ziehen oder klicken, um auszuwählen</p>
                      <p className="ant-upload-hint">Es wird ausschließlich <strong>PDF</strong> akzeptiert.</p>
                    </Upload.Dragger>
                  </>
                ) : (
                  <Flex align="center" gap={8}>
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                    <Text type="success">
                      Bereits hochgeladen: <strong>{meta?.signedApplication?.filename}</strong>
                    </Text>
                  </Flex>
                )}
              </Card>
            )}

            {/* Geburtsurkunde-Upload */}
            {needsBirthCertificate && (
              <Card size="small" style={{ marginBottom: 8 }} title="(Beglaubigte) Geburtsurkunde">
                {!hasBC ? (
                  <>
                    <Paragraph>
                      <strong>Laden Sie hier die (beglaubigte) Geburtsurkunde hoch.</strong><br />
                      Akzeptiert werden <strong>PDF</strong> oder <strong>Bilddateien</strong> (JPG/PNG).
                    </Paragraph>
                    {!downloadedOnce &&
                      needsDownload &&
                      check !== CheckType.BIRTH_CERTIFICATE && (
                        <Alert
                          type="warning"
                          showIcon
                          message="Zuerst herunterladen"
                          description="Bitte laden Sie das PDF zunächst herunter. Danach wird der Upload freigeschaltet."
                          style={{ marginBottom: 12 }}
                        />
                      )}
                    <Upload.Dragger
                      name="file"
                      multiple={false}
                      accept="application/pdf,image/*"
                      customRequest={uploadTo('upload-birth-certificate')}
                      disabled={!canUploadBC}
                      showUploadList={false}
                      className={!canUploadBC && !hasBC ? styles.locked : undefined}
                    >
                      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                      <p className="ant-upload-text">Datei hierher ziehen oder klicken, um auszuwählen</p>
                      <p className="ant-upload-hint">
                        Achten Sie auf gute Lesbarkeit (Name, Geburtsdatum, ggf. Stempel/Unterschrift).
                      </p>
                    </Upload.Dragger>
                  </>
                ) : (
                  <Flex align="center" gap={8}>
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                    <Text type="success">
                      Bereits hochgeladen: <strong>{meta?.birthCertificate?.filename}</strong>
                    </Text>
                  </Flex>
                )}
              </Card>
            )}

            <Card size="small" style={{ marginBottom: 8 }} title="Zusätzliche DFB-Unterlagen (nur bei Rückfrage)">
              <Paragraph>
                Wenn wir zusätzliche Unterlagen angefordert haben (z. B. Ausweiskopie, Meldebescheinigung),
                können Sie diese hier hochladen.
              </Paragraph>
              <Upload.Dragger
                name="file"
                multiple={false}
                accept="application/pdf,image/*"
                customRequest={uploadTo('upload-additional-document')}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">Zusätzliche Datei hochladen</p>
                <p className="ant-upload-hint">Erlaubt: PDF oder Bilddatei (JPG/PNG), max. 10 MB</p>
              </Upload.Dragger>
              {additionalDocuments.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text strong>Bereits hochgeladen:</Text>
                  <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                    {additionalDocuments.map((doc, idx) => (
                      <li key={`${doc.filename}-${idx}`}>
                        {doc.filename} ({(doc.size ?? 0).toLocaleString()} Bytes)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {completed && (
              <>
                <Divider />
                <Alert
                  type="success"
                  showIcon
                  message="Registrierung abgeschlossen"
                  description="Die erforderlichen Unterlagen sind vollständig eingegangen. Falls wir später zusätzliche Unterlagen anfordern, können Sie diese weiterhin im Abschnitt oben hochladen."
                />
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
