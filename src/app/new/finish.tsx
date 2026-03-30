'use client';

import Signature from '@uiw/react-signature';
import { Button, Checkbox, Form, Input, Space, message } from 'antd';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import d3ToPng from 'd3-svg-to-png';
import dayjs, { Dayjs } from 'dayjs';
import Registration from '@/models/registration.model';

type Props = {
  registration: Registration;
  setRegistration: (reg: Registration) => void;
  onActivated?: (registrationId: string) => void; // bei erfolgreicher Verifizierung
};

export type FinishHandle = {
  submitAndSendCode: () => Promise<string | null>;
  verifyCode: () => Promise<boolean>;
  getRegId: () => string | null;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

const Finish = forwardRef<FinishHandle, Props>(function Finish(
  { registration, setRegistration, onActivated },
  ref,
) {
  const [form] = Form.useForm();
  const sigPlayerRef = useRef<any>(null);
  const sigAdultRef = useRef<any>(null);

  const [creating, setCreating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [regId, setRegId] = useState<string | null>(null);

  /** ---------- Helpers ---------- */

  const toDateOnly = (v?: string | Dayjs | Date | null): string | undefined => {
    if (!v) return undefined;
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
      return dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD') : undefined;
    }
    // @ts-ignore
    if (dayjs.isDayjs?.(v)) return (v as Dayjs).format('YYYY-MM-DD');
    if (v instanceof Date) return dayjs(v).format('YYYY-MM-DD');
    try {
      return dayjs(v as any).format('YYYY-MM-DD');
    } catch {
      return undefined;
    }
  };

  async function exportSignature(refEl: React.RefObject<any>): Promise<string | null> {
    if (refEl.current?.toDataURL) {
      return refEl.current.toDataURL('image/png');
    }
    if (refEl.current?.svg) {
      const dataUrl = await d3ToPng(refEl.current.svg, 'signature', {
        scale: 3,
        format: 'png',
        quality: 1,
        download: false,
        ignore: '.ignored',
        background: 'transparent',
      });
      return typeof dataUrl === 'string' ? dataUrl : null;
    }
    return null;
  }

  function serializeForApi(src: any) {
    const bank = src.bankAccount ?? {};
    const bankAccount = {
      accoountHolder: bank.accoountHolder ?? bank.accountHolder ?? '',
      bic: bank.bic ?? '',
      bankName: bank.bankName ?? '',
      iban: bank.iban ?? '',
      checkSEPA: !!bank.checkSEPA,
    };

    // Datenschutz (Step4) – Mapping optionaler UI-Felder → Modell
    const media = src.mediaChannels ?? [];
    const dataProtection = {
      checkContactPhone: !!src.sharePhone,
      checkContactEmail: !!src.shareEmail,
      checkPublishHomepage: media.includes('website'),
      checkPublishFacebook: media.includes('facebook'),
      checkPublishInstagram: media.includes('instagram'),
      checkPublishNewspaper: media.includes('regional'),
      checkPublishOtherSocialMedia: media.includes('other'),
      checkDataProtection: !!src.dataProcessingConsent,
      adultName: src.guardianName ?? '',
      checkDataProtectionAdult: !!src.guardianConsent,
      checkPictureConsent: !!src.photoUsageConsentAssoc,
      checkPictureConsentFussballDe: !!src.u16ParentPublicationConsent,
      checkUseOfPlayerPicture: !!src.photoRightsGuarantee,
      checkGameReports: !!src.u16MatchReportsConsent,
      checkPlayerProfile: !!src.u16PlayerProfileConsent,
    };

    // Gesundheit (Step6)
    const youth = src.youthCategories ?? [];
    const fitness: 'fit' | 'conditional' | undefined = src.healthFitnessStatus;
    const health = {
      playClassification: Array.isArray(youth) && youth.length > 0 ? youth[0] : src.playClassification,
      checkNoInjuries: fitness === 'fit',
      checkInjuries: fitness === 'conditional',
      injuries: fitness === 'conditional' ? (src.healthRestrictions ?? '') : (src.injuries ?? ''),
      checkDrugs: src.checkDrugs ?? '',
      checkHealthClaim: !!src.healthConsent,
    };

    const eligibilityToPlay = {
      typeOfApplication: src.applicationType,
      typeOfCheck: src.birthdateProofType,
      passNo: src.passNr ?? '',
      oldAssociation: src.oldAssociation ?? '',
      oldTeam: src.oldTeam ?? '',
      exitDate: toDateOnly(src.exitDate),
      existingPenalty:
        typeof src.existingPenalty === 'string'
          ? src.existingPenalty === 'yes'
          : !!src.existingPenalty,
      activePenalty:
        typeof src.activePenalty === 'string'
          ? src.activePenalty === 'yes'
          : !!src.activePenalty,
      stateOfOrigin: src.stateOfOrigin ?? '',
      birthCity: src.birthCity ?? '',
      lastCityInForeignCountry: src.lastCityInForeignCountry ?? '',
      lastCountry: src.lastCountry ?? '',
      inGermanySince: toDateOnly(src.inGermanySince),
      firstNameOfFatherAndMother: src.firstNameOfFatherAndMother ?? '',
      checkCorrectness: !!src.truthConfirm,
    };

    const payload = {
      entryDate: toDateOnly(src.entryDate),
      typeOfMembership: src.typeOfMembership,
      gender: src.gender,
      firstName: src.firstName,
      lastName: src.lastName,
      birthDate: toDateOnly(src.birthDate),
      birthCity: src.birthCity,
      address: src.address,
      postalCode: src.postalCode,
      city: src.city,
      email: src.email,
      phone: src.phone,
      mobile: src.mobile,
      checkDisclaimerInjuries: !!src.checkDisclaimerInjuries,
      bankAccount,
      checkCoodeOfHonor: !!src.checkCoodeOfHonor,
      checkDutyOfSupervision: !!src.supervisionConsent || !!src.checkDutyOfSupervision,
      dataProtection,
      health,
      emailForVerification: src.emailForVerification,
      signaturePlayer: src.signaturePlayer,
      signatureAdult: src.signatureAdult,
      eligibilityToPlay,
    };

    return JSON.parse(JSON.stringify(payload));
  }

  /** ---------- Actions (exponierbar) ---------- */

  const submitAndSendCode = async (): Promise<string | null> => {
    try {
      // 1) E-Mail + Bestätigung prüfen
      const vals = await form.validateFields(['emailForVerification', 'confirmAccuracy']);
      const email = vals.emailForVerification as string;

      // 2) Signaturen exportieren (REIHENFOLGE: Unterschrift -> E-Mail -> Senden)
      const [sigPlayer, sigAdult] = await Promise.all([
        exportSignature(sigPlayerRef),
        exportSignature(sigAdultRef),
      ]);
      if (!sigPlayer) {
        message.error('Bitte zuerst die Spieler-Unterschrift setzen.');
        return null;
      }

      // 3) In den State schreiben (damit UI & Payload konsistent sind)
      const regWithSig: Registration = {
        ...registration,
        emailForVerification: email,
        signaturePlayer: sigPlayer,
        signatureAdult: sigAdult ?? registration.signatureAdult ?? '',
      } as Registration;
      setRegistration(regWithSig);

      // 4) Serialisieren & POST /registrations
      const payload = serializeForApi(regWithSig);
      setCreating(true);
      const res = await fetch(`${apiBase}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Fehler beim Erstellen (${res.status})`);
      }
      const data = await res.json();
      setRegId(data.id);
      message.success('Registrierung gesendet. Der Code wurde per E-Mail verschickt.');
      return data.id as string;
    } catch (err: any) {
      message.error(err?.message ?? 'Senden fehlgeschlagen.');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const goToUpload = (id: string) => {
    if (typeof window !== 'undefined') {
      window.location.assign(`/new/upload/${id}`); // harter Redirect, 100% zuverlässig
    }
  };

  const verifyCode = async (): Promise<boolean> => {
    try {
      if (!regId) {
        message.error('Bitte zuerst „Code senden & Registrierung abschicken“ klicken.');
        return false;
      }
      const { code } = await form.validateFields(['code']);
      setVerifying(true);

      const res = await fetch(`${apiBase}/registrations/${encodeURIComponent(regId)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Verifizierung fehlgeschlagen (${res.status}).`);
      }

      message.success('Code bestätigt – Weiter zum Upload.');
      goToUpload(regId);
      onActivated?.(regId);
      return true;
    } catch (err: any) {
      message.error(err?.message ?? 'Verifizierung fehlgeschlagen.');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submitAndSendCode,
    verifyCode,
    getRegId: () => regId,
  }));

  /** ---------- UI ---------- */

  return (
    <>
      <p>Vielen Dank! Wir haben nun alle Daten, die wir für die Anmeldung benötigen.</p>
      <p>Bitte unterschreiben Sie zuerst (bei Minderjährigen zusätzlich eine Erziehungsberechtigten-Unterschrift).</p>

      <p>Spieler hier unterschreiben:</p>
      <Signature ref={sigPlayerRef} height={300} style={{ border: '1px dashed black' }} />
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => sigPlayerRef.current?.clear?.()}>Unterschrift Spieler löschen</Button>
      </Space>

      <p>Erziehungsberechtigte/r hier unterschreiben:</p>
      <Signature ref={sigAdultRef} height={300} style={{ border: '1px dashed black' }} />
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => sigAdultRef.current?.clear?.()}>Unterschrift Erziehungsberechtigte/r löschen</Button>
      </Space>

      <Form
        form={form}
        layout="vertical"
      >
        <p>Geben Sie nun die E-Mail-Adresse eines/er Erziehungsberechtigten ein. Dorthin senden wir den Bestätigungscode.</p>
        <Form.Item
          label="E-Mail Adresse eines/er Erziehungsberechtigten"
          name="emailForVerification"
          rules={[
            { required: true, message: 'Bitte E-Mail angeben.' },
            { type: 'email', message: 'Bitte eine gültige E-Mail angeben.' },
          ]}
        >
          <Input placeholder="max.mustermann@example.com" />
        </Form.Item>

        <Form.Item
          name="confirmAccuracy"
          valuePropName="checked"
          rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject('Bitte bestätigen.')) }]}
        >
          <Checkbox>
            Ich bestätige, dass die Angaben vollständig und korrekt sind und die Unterschriften rechtsverbindlich abgegeben wurden.
          </Checkbox>
        </Form.Item>

        {/* Phase 1: Senden & Code anfordern */}
        {!regId && (
          <Button type="primary" onClick={submitAndSendCode} loading={creating}>
            Code senden & Registrierung abschicken
          </Button>
        )}

        {/* Phase 2: Code-Eingabe erst NACH Versand */}
        {regId && (
          <>
            <p style={{ marginTop: 24 }}>
              Der Bestätigungscode wurde an die angegebene E-Mail gesendet. Bitte geben Sie den Code ein, um die Anmeldung zu aktivieren.
            </p>
            <Form.Item
              label="Bestätigungscode (6-stellig)"
              name="code"
              rules={[
                { required: true, message: 'Bitte den zugesandten Code eingeben.' },
                { len: 6, message: 'Der Code muss 6 Zeichen lang sein.' },
              ]}
            >
              <Input maxLength={6} inputMode="numeric" placeholder="z. B. 083719" />
            </Form.Item>
            <Button onClick={verifyCode} type="primary" ghost loading={verifying}>
              Code prüfen & Anmeldung aktivieren
            </Button>
          </>
        )}
      </Form>
    </>
  );
});

export default Finish;
