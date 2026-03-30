'use client';

import Registration from '@/models/registration.model';
import { Checkbox, Form, Input, Radio, Typography } from 'antd';
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';

type Props = {
  registration: Registration;
  setRegistration: (registration: Registration) => void;
};

export type Step7Handle = {
  validate: () => Promise<boolean>;
};

const style: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const { Paragraph, Text } = Typography;

const Step7 = forwardRef<Step7Handle, Props>(function Step7({ registration, setRegistration }, ref) {
  const [form] = Form.useForm();

  // Parent ruft dies vor "Weiter" auf
  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await form.validateFields();
        return true;
      } catch (err: any) {
        const first = err?.errorFields?.[0];
        if (first?.name) {
          // @ts-ignore: AntD akzeptiert string|string[]
          form.scrollToField(first.name, { block: 'center' });
        }
        return false;
      }
    },
  }));

  // Vorbelegen aus Parent-State (mit sinnvollen Defaults)
  useEffect(() => {
    form.setFieldsValue({
      applicationType: (registration as any).applicationType ?? 1,      // wie ursprünglicher Default
      birthdateProofType: (registration as any).birthdateProofType ?? 1,
      truthConfirm: (registration as any).truthConfirm ?? false,

      passNr: (registration as any).passNr ?? '',
      oldTeam: (registration as any).oldTeam ?? '',
      oldAssociation: (registration as any).oldAssociation ?? '',
      exitDate: (registration as any).exitDate ?? undefined,
      existingPenalty: (registration as any).existingPenalty ?? undefined,  // 'yes' | 'no'
      activePenalty: (registration as any).activePenalty ?? undefined,      // 'yes' | 'no'

      stateOfOrigin: (registration as any).stateOfOrigin ?? '',
      birthCity: (registration as any).birthCity ?? '',
      lastCityInForeignCountry: (registration as any).lastCityInForeignCountry ?? '',
      lastCountry: (registration as any).lastCountry ?? '',
      inGermanySince: (registration as any).inGermanySince ?? undefined,
      firstNameOfFatherAndMother: (registration as any).firstNameOfFatherAndMother ?? '',

      reason: (registration as any).reason ?? '',
      lostOfPass: (registration as any).lostOfPass ?? false,
    });
  }, [registration, form]);

  // Änderungen zurück in Parent spiegeln
  const onValuesChange = (_: any, allValues: any) => {
    setRegistration({ ...registration, ...allValues });
  };

  const applicationType = Form.useWatch('applicationType', form) as number | undefined;
  const birthdateProofType = Form.useWatch('birthdateProofType', form) as number | undefined;

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Paragraph><Text strong>Antrag auf Erteilung einer Spielberechtigung</Text></Paragraph>
      <Paragraph>Bitte wählen Sie aus:</Paragraph>

      {/* Typ der Antragstellung */}
      <Form.Item
        name="applicationType"
        rules={[{ required: true, message: 'Bitte eine Option auswählen.' }]}
      >
        <Radio.Group style={style} options={[
          { value: 1, label: 'Erstaustellung' },
          { value: 2, label: 'Vereinswechsel' },
          { value: 3, label: 'Spieler aus dem Ausland' },
          { value: 4, label: 'Zweitausfertigung' },
        ]} />
      </Form.Item>

      {/* --- Typ 1: Erstausstellung --- */}
      {applicationType === 1 && (
        <>
          <Paragraph><Text strong>Hiermit beantrage ich die Erteilung einer Spielberechtigung für mein Kind.</Text></Paragraph>
          <Paragraph>Wie möchten Sie die Bestätigung des Geburtsdatums erbringen?</Paragraph>

          <Form.Item
            name="birthdateProofType"
            rules={[{ required: true, message: 'Bitte eine Art der Bestätigung wählen.' }]}
          >
            <Radio.Group
              style={style}
              options={[
                { value: 1, label: 'Beglaubigte Kopie der Geburtsurkunde' },
                { value: 2, label: 'Beglaubigung des Antrags durch das Einwohnermeldeamt bzw. Bürgerbüro' },
                { value: 3, label: 'Kopie der Geburtsurkunde' },
              ]}
            />
          </Form.Item>

          {birthdateProofType === 1 || birthdateProofType === 2 ? (
            <Paragraph>
              Sie können die beglaubigte Kopie der Geburtsurkunde bzw. den beglaubigten Antrag im Anschluss an diese Anmeldung
              hochladen. Das Original reichen Sie bitte bei Ihrem Trainer ein.
            </Paragraph>
          ) : (
            <>
              <Paragraph>Sie können die Kopie der Geburtsurkunde im Anschluss der Anmeldung hochladen.</Paragraph>
              <Paragraph>
                <Text strong>
                  Bitte beachten Sie, dass die Anmeldung 6–8 Wochen in Anspruch nehmen kann, da die Kopie postalisch an den Kreis
                  zur Beglaubigung geschickt werden muss. Wir empfehlen die anderen beiden Optionen.
                </Text>
              </Paragraph>
            </>
          )}

          <Form.Item
            name="truthConfirm"
            valuePropName="checked"
            rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject('Bitte die Richtigkeit der Angaben bestätigen.')) }]}
          >
            <Checkbox>
              Die Richtigkeit vorstehender Angaben wird versichert. Bei nachträglicher Feststellung der Unrichtigkeit werden
              Verein und Spieler im Rahmen eines sportgerichtlichen Verfahrens nach der Satzung und Ordnung des WDFV belangt.
              Der Spieler bzw. ein Erziehungsberechtigter erklärt sich damit einverstanden, dass der WDFV die Spielerdaten
              gemäß § 43 Verbandssatzung speichert und weiterverwendet.
            </Checkbox>
          </Form.Item>
        </>
      )}

      {/* --- Typ 2: Vereinswechsel --- */}
      {applicationType === 2 && (
        <>
          <Paragraph>Hiermit beantrage ich die Erteilung einer Spielberechtigung nach einem Vereinswechsel. Es existiert bereits ein Pass.</Paragraph>

          <Form.Item label="Passnummer (falls bekannt)" name="passNr">
            <Input type="text" />
          </Form.Item>

          <Form.Item
            label="Bisher gespielt bei (Verein):"
            name="oldTeam"
            rules={[{ required: true, message: 'Bitte den alten Verein angeben.' }]}
          >
            <Input type="text" />
          </Form.Item>

          <Form.Item label="Soweit nicht Westdeutscher Fußballverband, Angabe des Fußballverbandes:" name="oldAssociation">
            <Input type="text" />
          </Form.Item>

          <Form.Item
            label="Austritt (per Einschreiben) am:"
            name="exitDate"
            rules={[{ required: true, message: 'Bitte das Austrittsdatum angeben.' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            label="Besteht noch eine Verbandsstrafe:"
            name="existingPenalty"
            rules={[{ required: true, message: 'Bitte auswählen.' }]}
          >
            <Radio.Group options={[
              { value: 'yes', label: 'Ja' },
              { value: 'no', label: 'Nein' },
            ]} />
          </Form.Item>

          <Form.Item
            label="Noch ausstehende Verbandsstrafe:"
            name="activePenalty"
            rules={[{ required: true, message: 'Bitte auswählen.' }]}
          >
            <Radio.Group options={[
              { value: 'yes', label: 'Ja' },
              { value: 'no', label: 'Nein' },
            ]} />
          </Form.Item>
        </>
      )}

      {/* --- Typ 3: Spieler aus dem Ausland --- */}
      {applicationType === 3 && (
        <>
          <Paragraph>Hiermit beantrage ich die Erteilung einer Spielberechtigung und habe vorher im Ausland gewohnt.</Paragraph>

          <Form.Item
            label="Staatsangehörigkeit:"
            name="stateOfOrigin"
            rules={[{ required: true, message: 'Bitte Staatsangehörigkeit angeben.' }]}
          >
            <Input type="text" />
          </Form.Item>

          <Form.Item
            label="Geburtsort:"
            name="birthCity"
            rules={[{ required: true, message: 'Bitte Geburtsort angeben.' }]}
          >
            <Input type="text" />
          </Form.Item>

          <Form.Item
            label="Letzter Wohnort (Stadt) im Ausland:"
            name="lastCityInForeignCountry"
            rules={[{ required: true, message: 'Bitte letzten Wohnort im Ausland angeben.' }]}
          >
            <Input type="text" />
          </Form.Item>

          <Form.Item
            label="Land / Staat:"
            name="lastCountry"
            rules={[{ required: true, message: 'Bitte das Land angeben.' }]}
          >
            <Input type="text" />
          </Form.Item>

          <Form.Item
            label="In Deutschland ansässig ab:"
            name="inGermanySince"
            rules={[{ required: true, message: 'Bitte Datum angeben.' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            label="Vorname Vater und Mutter:"
            name="firstNameOfFatherAndMother"
            rules={[{ required: true, message: 'Bitte Vornamen von Vater und Mutter angeben.' }]}
          >
            <Input type="text" />
          </Form.Item>

          <Paragraph>
            Für Spieler aus bestimmten Ländern werden zusätzliche Angaben benötigt (siehe Hinweise des WDFV zu Spielberechtigungen).
          </Paragraph>
        </>
      )}

      {/* --- Typ 4: Zweitausfertigung --- */}
      {applicationType === 4 && (
        <>
          <Paragraph>Hiermit beantrage ich eine Zweitausfertigung der Spielberechtigung.</Paragraph>

          <Form.Item
            label="Begründung:"
            name="reason"
            rules={[{ required: true, message: 'Bitte eine Begründung angeben.' }]}
          >
            <Input type="text" />
          </Form.Item>

          <Form.Item label="Passverlust:" name="lostOfPass" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </>
      )}
    </Form>
  );
});

export default Step7;
