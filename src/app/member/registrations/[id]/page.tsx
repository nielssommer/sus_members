// app/member/registrations/[id]/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Descriptions, Divider, Empty, Input, List, message, Popconfirm, Select, Space, Steps, Tabs, Tag, Typography } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import MemberLayout from '../../_components/MemberLayout';
import { MembershipType, gender as Gender, TypeOfApplication, CheckType, RegistrationStatus } from '@/models/enums.model';

const { Title, Text } = Typography;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUSES = [
  'Neu',
  'Wartet auf Upload der Unterlagen',
  'In Bearbeitung',
  'Warten auf Bearbeitung beim Kreis',
  'Rückfragen / Bearbeitung pausiert',
  'Abgelehnt',
  'Spielberechtigung beantragt',
  'Abgeschlossen',
] as const;
type StatusType = typeof STATUSES[number];
type StatusLabel = typeof STATUSES[number];

const ENUM_KEYS = Object.values(RegistrationStatus) as RegistrationStatus[];
type StatusEnum = RegistrationStatus;

// Legacy-Werte (alte API/UI-Version) auf aktuelles Enum mappen
const LEGACY_STATUS_TO_CURRENT: Record<string, RegistrationStatus> = {
  WAITING_FOR_UPLOAD: RegistrationStatus.WAITING_UPLOAD,
  WAITING_AT_DISTRICT: RegistrationStatus.WAITING_KREIS,
  ON_HOLD: RegistrationStatus.PAUSED,
  ELIGIBILITY_APPLIED: RegistrationStatus.SUBMITTED,
  COMPLETED: RegistrationStatus.DONE,
};

// Enum -> Label
const ENUM_TO_LABEL: Record<StatusEnum, StatusLabel> = {
  NEW: 'Neu',
  WAITING_UPLOAD: 'Wartet auf Upload der Unterlagen',
  IN_PROGRESS: 'In Bearbeitung',
  WAITING_KREIS: 'Warten auf Bearbeitung beim Kreis',
  PAUSED: 'Rückfragen / Bearbeitung pausiert',
  REFUSED: 'Abgelehnt',
  SUBMITTED: 'Spielberechtigung beantragt',
  DONE: 'Abgeschlossen',
};

// Label -> Enum
const LABEL_TO_ENUM: Record<StatusLabel, StatusEnum> = Object.fromEntries(
  Object.entries(ENUM_TO_LABEL).map(([k, v]) => [v, k as StatusEnum])
) as Record<StatusLabel, StatusEnum>;

// Hilfsfunktionen
const normalizeStatusLabel = (v: any): StatusLabel => {
  if (v == null || v === '') return 'Neu';
  if (typeof v === 'string') {
    const current = LEGACY_STATUS_TO_CURRENT[v] ?? (v as RegistrationStatus);
    // Enum-String?
    if ((ENUM_KEYS as readonly string[]).includes(current as any)) return ENUM_TO_LABEL[current as StatusEnum];
    // Bereits ein Label?
    if ((STATUSES as readonly string[]).includes(v)) return v as StatusLabel;
    // Zahl als String?
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && STATUSES[n - 1]) return STATUSES[n - 1];
    return 'Neu';
  }
  if (typeof v === 'number') return STATUSES[v - 1] ?? 'Neu';
  return 'Neu';
};

const normalizeStatusEnum = (v: any): StatusEnum | undefined => {
  if (v == null || v === '') return undefined;
  if (typeof v === 'string') {
    const current = LEGACY_STATUS_TO_CURRENT[v] ?? (v as RegistrationStatus);
    if ((ENUM_KEYS as readonly string[]).includes(current as any)) return current as StatusEnum; // schon Enum
    if ((STATUSES as readonly string[]).includes(v)) return LABEL_TO_ENUM[v as StatusLabel]; // Label
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && STATUSES[n - 1]) return LABEL_TO_ENUM[STATUSES[n - 1]];
    return undefined;
  }
  if (typeof v === 'number') return STATUSES[v - 1] ? LABEL_TO_ENUM[STATUSES[v - 1]] : undefined;
  return undefined;
};

const bool = (v?: boolean) => (v ? 'Ja' : 'Nein');
const val = (v: any) => (v === null || v === undefined || v === '' ? '—' : String(v));

const asNumber = (v: any): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return v;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? undefined : n;
};

const formatGender = (g?: string) => {
  const map: Record<string, string> = { [Gender.MALE]: 'Männlich', [Gender.FEMALE]: 'Weiblich', [Gender.DIVERSE]: 'Divers' };
  return g ? (map[g] ?? String(g)) : '—';
};

const formatMembershipType = (t?: string) => {
  const map: Record<string, string> = { [MembershipType.ACTIVE]: 'Aktiv', [MembershipType.PASSIVE]: 'Passiv' };
  return t ? (map[t] ?? String(t)) : '—';
};

const formatTypeOfApplication = (v?: number | string) => {
  const n = asNumber(v);
  const map: Record<number, string> = {
    [TypeOfApplication.FIRST_ISSUE]: 'Erstausstellung',
    [TypeOfApplication.CLUB_CHANGE]: 'Vereinswechsel',
    [TypeOfApplication.PLAYER_FROM_FOREIGN_COUNTRY]: 'Aus dem Ausland',
    [TypeOfApplication.SECOND_COPY]: 'Zweitschrift',
  };
  return n !== undefined ? (map[n] ?? String(v)) : '—';
};

const formatCheckType = (v?: number | string) => {
  const n = asNumber(v);
  const map: Record<number, string> = {
    [CheckType.BIRTH_CERTIFICATE]: 'Geburtsurkunde',
    [CheckType.CERTIFICATION_BY_OFFICE]: 'Amtliche Bestätigung',
    [CheckType.COPY_OF_BIRTH_CERTIFICATE]: 'Kopie der Geburtsurkunde',
  };
  return n !== undefined ? (map[n] ?? String(v)) : '—';
};

export default function RegistrationDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [full, setFull] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkVisibility, setRemarkVisibility] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [remarkAddUploadHint, setRemarkAddUploadHint] = useState(false);

  const at = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${id}/full`, {
        headers: { Authorization: at ? `Bearer ${at}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Laden fehlgeschlagen');
      setFull(await res.json());
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const r = full?.registration;
  const remarks = full?.remarks ?? [];

  const statusIndex = useMemo(() => {
    if (!r?.status) return 0;
    const idx = STATUSES.findIndex(s => s === normalizeStatusLabel(r.status));
    return idx >= 0 ? idx : 0;
  }, [r?.status]);

  const changeStatus = async (next: StatusLabel) => {
    setSavingStatus(true);
    try {
      const enumVal = normalizeStatusEnum(next);
      if (!enumVal) throw new Error('Unbekannter Statuswert');

      const res = await fetch(`${API_BASE}/admin/registrations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: at ? `Bearer ${at}` : '',
        },
        body: JSON.stringify({ status: enumVal }), // <<— Enum zur API!
      });
      if (!res.ok) throw new Error('Status konnte nicht aktualisiert werden');
      await fetchAll();
      message.success('Status aktualisiert');
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Aktualisieren');
    } finally {
      setSavingStatus(false);
    }
  };

  const addRemark = async () => {
    if (!remarkText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${id}/remarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: at ? `Bearer ${at}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: remarkText,
          visibility: remarkVisibility,
          addUploadHint: remarkVisibility === 'EXTERNAL' && remarkAddUploadHint,
        }),
      });
      if (!res.ok) throw new Error('Bemerkung konnte nicht gespeichert werden');
      setRemarkText('');
      setRemarkAddUploadHint(false);
      message.success(
        remarkVisibility === 'EXTERNAL'
          ? 'Externe Bemerkung gespeichert und E-Mail verschickt'
          : 'Interne Bemerkung gespeichert'
      );
      await fetchAll();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Speichern der Bemerkung');
    }
  };

  const deleteRegistration = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: at ? `Bearer ${at}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('Registrierung gelöscht');
      router.replace('/member/registrations');
    } catch (e: any) {
      message.error(e?.message ?? 'Löschen fehlgeschlagen');
    } finally {
      setDeleting(false);
    }
  };

  const copyAll = async () => {
    if (!r) return;
    const lines: string[] = [];
    const push = (label: string, value: any) => lines.push(`${label}: ${val(value)}`);

    push('Vorname', r.firstName);
    push('Nachname', r.lastName);
    push('Geburtsdatum', r.birthDate && new Date(r.birthDate).toLocaleDateString());
    push('Geburtsort', r.birthCity);
    push('Geschlecht', r.gender);
    push('Mitgliedschaft', r.typeOfMembership);
    push('Eintritt ab', r.entryDate && new Date(r.entryDate).toLocaleDateString());

    push('Adresse', r.address);
    push('PLZ', r.zip);
    push('Ort', r.city);
    push('Telefon', r.phone);
    push('Mobil', r.mobile);
    push('E-Mail', r.email);

    push('Kontoinhaber', r?.bankAccount?.accountHolder || r?.bankAccount?.accoountHolder);
    push('IBAN', r?.bankAccount?.iban);
    push('BIC', r?.bankAccount?.bic);
    push('Bankname', r?.bankAccount?.bankName);
    push('SEPA-Einzug', bool(r?.bankAccount?.checkSEPA));

    push('Haftungsausschluss', bool(r.checkDisclaimerInjuries));
    push('Ehrenkodex', bool(r.checkCoodeOfHonor));
    push('Aufsichtspflicht', bool(r.checkDutyOfSupervision));

    const dp = r?.dataProtection || {};
    push('Kontakt: Telefon', bool(dp.checkContactPhone));
    push('Kontakt: E-Mail', bool(dp.checkContactEmail));
    push('Homepage', bool(dp.checkPublishHomepage));
    push('Facebook', bool(dp.checkPublishFacebook));
    push('Instagram', bool(dp.checkPublishInstagram));
    push('Presse', bool(dp.checkPublishNewspaper));
    push('Sonstiges', bool(dp.checkPublishOtherSocialMedia));
    push('DSGVO (Kind)', bool(dp.checkDataProtection));
    push('Erziehungsberechtigte/r', dp.adultName);
    push('DSGVO (Erwachsene)', bool(dp.checkDataProtectionAdult));
    push('Bildnis', bool(dp.checkPictureConsent));
    push('FUSSBALL.DE', bool(dp.checkPictureConsentFussballDe));
    push('Spielerfoto-Nutzung', bool(dp.checkUseOfPlayerPicture));
    push('Spielberichte', bool(dp.checkGameReports));
    push('Spielerprofil', bool(dp.checkPlayerProfile));

    const h = r?.health || {};
    push('Klassifizierung', h.playClassification);
    push('Keine Erkrankungen', bool(h.checkNoInjuries));
    push('Bedingt tauglich', bool(h.checkInjuries));
    push('Einschränkungen', h.injuries);
    push('Medikamente', h.checkDrugs);
    push('Angaben bestätigt', bool(h.checkHealthClaim));

    const e = r?.eligibilityToPlay || r?.eligibility || {};
    push('Antragsart', e.typeOfApplication);
    push('Nachweisart', e.typeOfCheck);
    push('Passnummer', e.passNo);
    push('Bisheriger Verein', e.oldTeam);
    push('Fußballverband alt', e.oldAssociation);
    push('Austritt am', e.exitDate && new Date(e.exitDate).toLocaleDateString());
    push('Verbandsstrafe besteht', bool(e.existingPenalty));
    push('Strafe ausstehend', bool(e.activePenalty));
    push('Staatsangehörigkeit', e.stateOfOrigin);
    push('Geburtsort', e.birthCity);
    push('Letzter Wohnort Ausland', e.lastCityInForeignCountry);
    push('Land/Staat', e.lastCountry);
    push('In DE seit', e.inGermanySince && new Date(e.inGermanySince).toLocaleDateString());
    push('Vornamen Eltern', e.firstNameOfFatherAndMother);
    push('Richtigkeit bestätigt', bool(e.checkCorrectness));

    push('E-Mail (Verifizierung)', r.emailForVerification);
    push('Status', r.status);
    push('Angelegt', r.createdAt && new Date(r.createdAt).toLocaleString());
    push('Aktualisiert', r.updatedAt && new Date(r.updatedAt).toLocaleString());

    await navigator.clipboard.writeText(lines.join('\n'));
    message.success('Alle Daten kopiert.');
  };

  const jsonExport = () => {
    window.open(`${API_BASE}/admin/registrations/${id}/export-json`, '_blank');
  };

  if (loading) {
    return (
      <MemberLayout>
        <Card>lädt …</Card>
      </MemberLayout>
    );
  }

  if (!r) {
    return (
      <MemberLayout>
        <Card>
          <Empty description="Keine Daten gefunden" />
        </Card>
      </MemberLayout>
    );
  }

  const fileSigned = r.signedApplication;
  const fileApplication = r.application;
  const fileBirth = r.birthCertificate;
  const additionalDocs = Array.isArray(r.additionalDocuments) ? r.additionalDocuments : [];
  const isPaperRegistration = !!(r?.paper?.originalUploadedAt || fileApplication);
  const canDelete = normalizeStatusEnum(r.status) === RegistrationStatus.WAITING_UPLOAD;

  return (
    <MemberLayout>
      <Card
        title={
          <Space>
            <span>{r.firstName} {r.lastName}</span>
            {isPaperRegistration ? <Tag color="gold">Papieranmeldung</Tag> : <Tag color="blue">Online</Tag>}
            <Tag>{normalizeStatusLabel(r.status)}</Tag>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="status"
          items={[
            {
              key: 'status',
              label: 'Status',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Steps
                    direction="vertical"
                    current={statusIndex}
                    items={STATUSES.map((s) => ({ title: s }))}
                  />
                  <Space>
                    <Text>Bearbeitungsstatus ändern:</Text>
                    <Select<StatusLabel>
                      style={{ minWidth: 320 }}
                      value={normalizeStatusLabel(r.status)}                 // Anzeige: Label
                      onChange={changeStatus}                                // wir mappen in der Funktion
                      options={STATUSES.map((s) => ({ value: s, label: s }))} // Labels bleiben gleich
                      loading={savingStatus}
                    />
                    <Popconfirm
                      title="Registrierung löschen?"
                      description="Nur im Status 'Wartet auf Upload' erlaubt."
                      okText="Löschen"
                      cancelText="Abbrechen"
                      okButtonProps={{ danger: true, loading: deleting }}
                      onConfirm={deleteRegistration}
                      disabled={!canDelete}
                    >
                      <Button danger disabled={!canDelete} loading={deleting}>
                        Registrierung löschen
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              ),
            },
            {
              key: 'signatures',
              label: 'Unterschriften',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Title level={5}>Spieler/in</Title>
                    <img
                      src={`${API_BASE}/admin/registrations/${id}/signature/player`}
                      alt="Unterschrift Spieler/in"
                      style={{ maxWidth: '100%', border: '1px solid #eee' }}
                    />
                  </div>
                  <div>
                    <Title level={5}>Erziehungsberechtigte/r</Title>
                    <img
                      src={`${API_BASE}/admin/registrations/${id}/signature/adult`}
                      alt="Unterschrift Erziehungsberechtigte/r"
                      style={{ maxWidth: '100%', border: '1px solid #eee' }}
                    />
                  </div>
                </Space>
              ),
            },
            {
              key: 'docs',
              label: 'Dokumente',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Title level={5}>Antrag (signiert/hochgeladen)</Title>
                    {fileSigned || fileApplication ? (
                      <>
                        <Text type="secondary">
                          {(fileSigned?.filename || fileApplication?.filename)} · {((fileSigned?.size ?? fileApplication?.size) ?? 0).toLocaleString()} Bytes
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <iframe
                            src={`${API_BASE}/admin/registrations/${id}/files/${fileSigned ? 'signed-application' : 'application'}`}
                            style={{ width: '100%', height: 520, border: '1px solid #eee' }}
                          />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={`${API_BASE}/admin/registrations/${id}/files/${fileSigned ? 'signed-application' : 'application'}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            In neuem Tab öffnen
                          </a>
                        </div>
                      </>
                    ) : (
                      <Text type="secondary">Kein Dokument vorhanden</Text>
                    )}
                  </div>

                  <Divider />

                  <div>
                    <Title level={5}>Papier-Anmeldung (Original)</Title>
                    {fileApplication ? (
                      <>
                        <Text type="secondary">
                          {fileApplication.filename} · {(fileApplication.size ?? 0).toLocaleString()} Bytes
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <iframe
                            src={`${API_BASE}/admin/registrations/${id}/files/application`}
                            style={{ width: '100%', height: 520, border: '1px solid #eee' }}
                          />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <a href={`${API_BASE}/admin/registrations/${id}/files/application`} target="_blank" rel="noreferrer">In neuem Tab öffnen</a>
                        </div>
                      </>
                    ) : (
                      <Text type="secondary">Kein Dokument vorhanden</Text>
                    )}
                  </div>

                  <Divider />

                  <div>
                    <Title level={5}>Geburtsurkunde</Title>
                    {fileBirth ? (
                      <>
                        <Text type="secondary">
                          {fileBirth.filename} · {(fileBirth.size ?? 0).toLocaleString()} Bytes
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <iframe
                            src={`${API_BASE}/admin/registrations/${id}/files/birth-certificate`}
                            style={{ width: '100%', height: 520, border: '1px solid #eee' }}
                          />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <a href={`${API_BASE}/admin/registrations/${id}/files/birth-certificate`} target="_blank" rel="noreferrer">In neuem Tab öffnen</a>
                        </div>
                      </>
                    ) : (
                      <Text type="secondary">Kein Dokument vorhanden</Text>
                    )}
                  </div>

                  <Divider />

                  <div>
                    <Title level={5}>Zusätzliche DFB-Unterlagen</Title>
                    {additionalDocs.length > 0 ? (
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {additionalDocs.map((doc: any, idx: number) => (
                          <Card key={`${doc?.filename ?? 'doc'}-${idx}`} size="small" title={doc?.filename || `Dokument ${idx + 1}`}>
                            <Text type="secondary">
                              {(doc?.size ?? 0).toLocaleString()} Bytes
                            </Text>
                            <div style={{ marginTop: 8 }}>
                              <iframe
                                src={`${API_BASE}/admin/registrations/${id}/files/additional/${idx}`}
                                style={{ width: '100%', height: 520, border: '1px solid #eee' }}
                              />
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <a href={`${API_BASE}/admin/registrations/${id}/files/additional/${idx}`} target="_blank" rel="noreferrer">
                                In neuem Tab öffnen
                              </a>
                            </div>
                          </Card>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">Keine zusätzlichen Unterlagen vorhanden</Text>
                    )}
                  </div>
                </Space>
              ),
            },
            {
              key: 'remarks',
              label: 'Bemerkungen',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <List
                    header={<b>Verlauf</b>}
                    dataSource={remarks}
                    locale={{ emptyText: 'Keine Bemerkungen' }}
                    renderItem={(m: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`${new Date(m.createdAt).toLocaleString()} — ${m.visibility} — ${m.authorName || m.authorEmail || 'Unbekannt'}`}
                          description={m.message}
                        />
                      </List.Item>
                    )}
                  />
                  <Divider />
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      value={remarkVisibility}
                      onChange={setRemarkVisibility}
                      style={{ width: 220 }}
                      options={[
                        { value: 'INTERNAL', label: 'Intern' },
                        { value: 'EXTERNAL', label: 'Extern (E-Mail an Erziehungsberechtigte)' },
                      ]}
                    />
                    <Input.TextArea
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                      placeholder="Bemerkung hinzufügen…"
                      autoSize={{ minRows: 2, maxRows: 6 }}
                    />
                  </Space.Compact>
                  <div>
                    <Checkbox
                      checked={remarkAddUploadHint}
                      disabled={remarkVisibility !== 'EXTERNAL'}
                      onChange={(e) => setRemarkAddUploadHint(e.target.checked)}
                    >
                      Upload-Hinweis zur E-Mail hinzufügen (Link zur Upload-Seite)
                    </Checkbox>
                  </div>
                  <div>
                    <Button type="primary" onClick={addRemark} disabled={!remarkText.trim()}>
                      Speichern
                    </Button>
                  </div>
                </Space>
              ),
            },
            {
              key: 'all',
              label: 'Alle Daten',
              children: (
                <div style={{ display: 'grid', gap: 16 }}>
                  <Space>
                    <Button onClick={copyAll}>Alles kopieren</Button>
                    <Button type="primary" onClick={jsonExport}>JSON exportieren</Button>
                  </Space>

                  <Descriptions title="Allgemein" bordered column={1} size="small">
                    <Descriptions.Item label="Vorname">{val(r.firstName)}</Descriptions.Item>
                    <Descriptions.Item label="Nachname">{val(r.lastName)}</Descriptions.Item>
                    <Descriptions.Item label="Geburtsdatum">{r.birthDate && new Date(r.birthDate).toLocaleDateString()}</Descriptions.Item>
                    <Descriptions.Item label="Geburtsort">{val(r.birthCity)}</Descriptions.Item>
                    <Descriptions.Item label="Geschlecht">{formatGender(r.gender)}</Descriptions.Item>
                    <Descriptions.Item label="Mitgliedschaft">{formatMembershipType(r.typeOfMembership)}</Descriptions.Item>
                    <Descriptions.Item label="Eintritt ab">{r.entryDate && new Date(r.entryDate).toLocaleDateString()}</Descriptions.Item>
                  </Descriptions>

                  <Descriptions title="Kontakt & Adresse" bordered column={1} size="small">
                    <Descriptions.Item label="Adresse">{val(r.address)}</Descriptions.Item>
                    <Descriptions.Item label="PLZ">{val(r.zip)}</Descriptions.Item>
                    <Descriptions.Item label="Ort">{val(r.city)}</Descriptions.Item>
                    <Descriptions.Item label="Telefon">{val(r.phone)}</Descriptions.Item>
                    <Descriptions.Item label="Mobil">{val(r.mobile)}</Descriptions.Item>
                    <Descriptions.Item label="E-Mail">{val(r.email)}</Descriptions.Item>
                  </Descriptions>

                  <Descriptions title="Bankverbindung" bordered column={1} size="small">
                    <Descriptions.Item label="Kontoinhaber">{val(r?.bankAccount?.accountHolder || r?.bankAccount?.accoountHolder)}</Descriptions.Item>
                    <Descriptions.Item label="IBAN">{val(r?.bankAccount?.iban)}</Descriptions.Item>
                    <Descriptions.Item label="BIC">{val(r?.bankAccount?.bic)}</Descriptions.Item>
                    <Descriptions.Item label="Bankname">{val(r?.bankAccount?.bankName)}</Descriptions.Item>
                    <Descriptions.Item label="SEPA-Einzug">{bool(r?.bankAccount?.checkSEPA)}</Descriptions.Item>
                  </Descriptions>

                  <Descriptions title="Einverständnisse" bordered column={1} size="small">
                    <Descriptions.Item label="Haftungsausschluss">{bool(r.checkDisclaimerInjuries)}</Descriptions.Item>
                    <Descriptions.Item label="Ehrenkodex">{bool(r.checkCoodeOfHonor)}</Descriptions.Item>
                    <Descriptions.Item label="Aufsichtspflicht">{bool(r.checkDutyOfSupervision)}</Descriptions.Item>
                  </Descriptions>

                  <Descriptions title="Datenschutz" bordered column={1} size="small">
                    <Descriptions.Item label="Kontakt: Telefon">{bool(r?.dataProtection?.checkContactPhone)}</Descriptions.Item>
                    <Descriptions.Item label="Kontakt: E-Mail">{bool(r?.dataProtection?.checkContactEmail)}</Descriptions.Item>
                    <Descriptions.Item label="Homepage">{bool(r?.dataProtection?.checkPublishHomepage)}</Descriptions.Item>
                    <Descriptions.Item label="Facebook">{bool(r?.dataProtection?.checkPublishFacebook)}</Descriptions.Item>
                    <Descriptions.Item label="Instagram">{bool(r?.dataProtection?.checkPublishInstagram)}</Descriptions.Item>
                    <Descriptions.Item label="Presse">{bool(r?.dataProtection?.checkPublishNewspaper)}</Descriptions.Item>
                    <Descriptions.Item label="Sonstiges">{bool(r?.dataProtection?.checkPublishOtherSocialMedia)}</Descriptions.Item>
                    <Descriptions.Item label="DSGVO (Kind)">{bool(r?.dataProtection?.checkDataProtection)}</Descriptions.Item>
                    <Descriptions.Item label="Erziehungsberechtigte/r">{val(r?.dataProtection?.adultName)}</Descriptions.Item>
                    <Descriptions.Item label="DSGVO (Erwachsene)">{bool(r?.dataProtection?.checkDataProtectionAdult)}</Descriptions.Item>
                    <Descriptions.Item label="Bildnis">{bool(r?.dataProtection?.checkPictureConsent)}</Descriptions.Item>
                    <Descriptions.Item label="FUSSBALL.DE">{bool(r?.dataProtection?.checkPictureConsentFussballDe)}</Descriptions.Item>
                    <Descriptions.Item label="Spielerfoto-Nutzung">{bool(r?.dataProtection?.checkUseOfPlayerPicture)}</Descriptions.Item>
                    <Descriptions.Item label="Spielberichte">{bool(r?.dataProtection?.checkGameReports)}</Descriptions.Item>
                    <Descriptions.Item label="Spielerprofil">{bool(r?.dataProtection?.checkPlayerProfile)}</Descriptions.Item>
                  </Descriptions>

                  <Descriptions title="Gesundheit" bordered column={1} size="small">
                    <Descriptions.Item label="Klassifizierung">{val(r?.health?.playClassification)}</Descriptions.Item>
                    <Descriptions.Item label="Keine Erkrankungen">{bool(r?.health?.checkNoInjuries)}</Descriptions.Item>
                    <Descriptions.Item label="Bedingt tauglich">{bool(r?.health?.checkInjuries)}</Descriptions.Item>
                    <Descriptions.Item label="Einschränkungen">{val(r?.health?.injuries)}</Descriptions.Item>
                    <Descriptions.Item label="Medikamente">{val(r?.health?.checkDrugs)}</Descriptions.Item>
                    <Descriptions.Item label="Angaben bestätigt">{bool(r?.health?.checkHealthClaim)}</Descriptions.Item>
                  </Descriptions>

                  <Descriptions title="Spielberechtigung" bordered column={1} size="small">
                    <Descriptions.Item label="Antragsart">
                    {formatTypeOfApplication(r?.eligibilityToPlay?.typeOfApplication || r?.eligibility?.typeOfApplication)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Nachweisart">
                    {formatCheckType(r?.eligibilityToPlay?.typeOfCheck || r?.eligibility?.typeOfCheck)}
                  </Descriptions.Item>
                    <Descriptions.Item label="Passnummer">{val(r?.eligibilityToPlay?.passNo || r?.eligibility?.passNo)}</Descriptions.Item>
                    <Descriptions.Item label="Bisheriger Verein">{val(r?.eligibilityToPlay?.oldTeam || r?.eligibility?.oldTeam)}</Descriptions.Item>
                    <Descriptions.Item label="Alter Verband">{val(r?.eligibilityToPlay?.oldAssociation || r?.eligibility?.oldAssociation)}</Descriptions.Item>
                    <Descriptions.Item label="Austritt am">
                      {(r?.eligibilityToPlay?.exitDate || r?.eligibility?.exitDate) &&
                        new Date(r?.eligibilityToPlay?.exitDate || r?.eligibility?.exitDate).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Verbandsstrafe besteht">{bool(r?.eligibilityToPlay?.existingPenalty || r?.eligibility?.existingPenalty)}</Descriptions.Item>
                    <Descriptions.Item label="Strafe ausstehend">{bool(r?.eligibilityToPlay?.activePenalty || r?.eligibility?.activePenalty)}</Descriptions.Item>
                    <Descriptions.Item label="Staatsangehörigkeit">{val(r?.eligibilityToPlay?.stateOfOrigin || r?.eligibility?.stateOfOrigin)}</Descriptions.Item>
                    <Descriptions.Item label="Geburtsort">{val(r?.eligibilityToPlay?.birthCity || r?.eligibility?.birthCity)}</Descriptions.Item>
                    <Descriptions.Item label="Letzter Wohnort Ausland">{val(r?.eligibilityToPlay?.lastCityInForeignCountry || r?.eligibility?.lastCityInForeignCountry)}</Descriptions.Item>
                    <Descriptions.Item label="Land/Staat">{val(r?.eligibilityToPlay?.lastCountry || r?.eligibility?.lastCountry)}</Descriptions.Item>
                    <Descriptions.Item label="In DE seit">
                      {(r?.eligibilityToPlay?.inGermanySince || r?.eligibility?.inGermanySince) &&
                        new Date(r?.eligibilityToPlay?.inGermanySince || r?.eligibility?.inGermanySince).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vornamen Eltern">{val(r?.eligibilityToPlay?.firstNameOfFatherAndMother || r?.eligibility?.firstNameOfFatherAndMother)}</Descriptions.Item>
                    <Descriptions.Item label="Richtigkeit bestätigt">{bool(r?.eligibilityToPlay?.checkCorrectness || r?.eligibility?.checkCorrectness)}</Descriptions.Item>
                  </Descriptions>

                  <Descriptions title="System" bordered column={1} size="small">
                    <Descriptions.Item label="Erfassung">
                      {isPaperRegistration ? 'Papieranmeldung' : 'Online-Anmeldung'}
                    </Descriptions.Item>
                    <Descriptions.Item label="E-Mail (Verifizierung)">{val(r.emailForVerification)}</Descriptions.Item>
                    <Descriptions.Item label="Status">{val(r.status)}</Descriptions.Item>
                    <Descriptions.Item label="Angelegt">{r.createdAt && new Date(r.createdAt).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Aktualisiert">{r.updatedAt && new Date(r.updatedAt).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Registrierungs-ID">{val(r._id)}</Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </MemberLayout>
  );
}
