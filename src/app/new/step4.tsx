'use client';

import Registration from '@/models/registration.model';
import { Checkbox, Flex, Form, Input, Typography } from 'antd';
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';

type Props = {
  registration: Registration;
  setRegistration: (registration: Registration) => void;
};

export type Step4Handle = {
  validate: () => Promise<boolean>;
};

const { Paragraph, Text } = Typography;

function getAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

const Step4 = forwardRef<Step4Handle, Props>(function Step4({ registration, setRegistration }, ref) {
  const [form] = Form.useForm();

  // Exponierte Methode: vom Parent aufrufen, bevor "Weiter" möglich ist
  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await form.validateFields();
        return true;
      } catch (err: any) {
        const first = err?.errorFields?.[0];
        if (first?.name) {
          // @ts-ignore string|string[]
          form.scrollToField(first.name, { block: 'center' });
        }
        return false;
      }
    },
  }));

  // Formular mit bereits vorhandenen Werten füllen
  useEffect(() => {
    form.setFieldsValue({
      sharePhone: (registration as any).sharePhone ?? false,
      shareEmail: (registration as any).shareEmail ?? false,
      mediaChannels: (registration as any).mediaChannels ?? [],
      dataProcessingConsent: (registration as any).dataProcessingConsent ?? false,
      guardianConsent: (registration as any).guardianConsent ?? false,
      guardianName: (registration as any).guardianName ?? '',
      photoRightsGuarantee: (registration as any).photoRightsGuarantee ?? false,
      photoUsageConsentAssoc: (registration as any).photoUsageConsentAssoc ?? false,
      photoUsageConsentFinal: (registration as any).photoUsageConsentFinal ?? false,
      u16MatchReportsConsent: (registration as any).u16MatchReportsConsent ?? false,
      u16PlayerProfileConsent: (registration as any).u16PlayerProfileConsent ?? false,
      u16ParentPublicationConsent: (registration as any).u16ParentPublicationConsent ?? false,
    });
  }, [registration, form]);

  // Änderungen aus dem Formular in den Parent-State spiegeln
  const onValuesChange = (_: any, allValues: any) => {
    setRegistration({ ...registration, ...allValues });
  };

  const age = getAge((registration as any).birthDate);
  const isMinor = age !== null && age < 18;
  const isUnder16 = age !== null && age < 16;

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Paragraph>
        <Text strong>Einwilligung in die Datenverarbeitung einschließlich der Veröffentlichung von Personenbildern im Zusammenhang mit dem Eintritt in den Verein</Text>
      </Paragraph>
      <Paragraph>
        Ich bin damit einverstanden, dass die vorgenannten Kontaktdaten zu Vereinszwecken durch den Verein genutzt
        und hierfür auch an andere Mitglieder des Vereins (z.B. zur Bildung von Fahrgemeinschaften) weitergegeben werden dürfen.
      </Paragraph>

      <Form.Item name="sharePhone" valuePropName="checked">
        <Checkbox>Telefonnummer / Handynummer</Checkbox>
      </Form.Item>
      <Form.Item name="shareEmail" valuePropName="checked">
        <Checkbox>E-Mail Adresse</Checkbox>
      </Form.Item>

      <Paragraph>
        Mir ist bekannt, dass die Einwilligung in die Datenverarbeitung der vorbenannten Angaben freiwillig erfolgt und jederzeit
        durch mich ganz oder teilweise mit Wirkung für die Zukunft widerrufen werden kann.
      </Paragraph>

      <Paragraph>
        <Text strong>Einwilligung in die Veröffentlichung von Personenbildnissen</Text>
      </Paragraph>
      <Paragraph>
        Ich willige ein, dass Fotos und Videos von meiner Person bei sportlichen Veranstaltungen und zur Präsentation von
        Mannschaften angefertigt und in folgenden Medien veröffentlicht werden dürfen (optional):
      </Paragraph>

      {/* Mehrfachauswahl der Medien-Kanäle (optional) */}
      <Form.Item name="mediaChannels">
        <Checkbox.Group style={{ width: '100%' }}>
          <Flex vertical gap={8}>
            <Checkbox value="website">Homepage des Vereins</Checkbox>
            <Checkbox value="facebook">Facebook-Seite des Vereins</Checkbox>
            <Checkbox value="instagram">Instagram-Seite des Vereins</Checkbox>
            <Checkbox value="regional">regionale Presse (z. B. WP/WR/Stadtanzeiger)</Checkbox>
            <Checkbox value="other">sonstige soziale Medien</Checkbox>
          </Flex>
        </Checkbox.Group>
      </Form.Item>

      <Paragraph>
        Ich bin darauf hingewiesen worden, dass die Fotos/Videos im Internet weltweit abrufbar sind …
      </Paragraph>

      {/* Zentrale Pflicht-Einwilligung Datenverarbeitung */}
      <Form.Item
        name="dataProcessingConsent"
        valuePropName="checked"
        rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject('Bitte der Datenverarbeitung zustimmen.')) }]}
      >
        <Checkbox>
          Ich stimme den oben genannten Bedingungen zu und erkläre mich mit der Verarbeitung meiner personenbezogenen Daten einverstanden.
        </Checkbox>
      </Form.Item>

      <Paragraph>
        <Text strong>Bei Minderjährigen bzw. Geschäftsunfähigen</Text>
      </Paragraph>
      <Paragraph>
        Bei Minderjährigen, die bereits das 14. Lebensjahr vollendet haben, ist neben der Einwilligung der gesetzlichen Vertreter
        auch die Einwilligung des Minderjährigen erforderlich.
      </Paragraph>

      {/* Diese beiden Felder werden nur für Minderjährige als Pflicht geprüft */}
      <Form.Item
        name="guardianConsent"
        valuePropName="checked"
        rules={[
          {
            validator: (_, v) =>
              isMinor ? (v ? Promise.resolve() : Promise.reject('Bitte die Zustimmung der Erziehungsberechtigten bestätigen.')) : Promise.resolve(),
          },
        ]}
      >
        <Checkbox>
          Ich/Wir habe/haben die Einwilligungserklärung … zur Kenntnis genommen und bin/sind mit der Veröffentlichung einverstanden.
          Die Informationspflichten gemäß Art. 13/14 DSGVO habe ich gelesen und zur Kenntnis genommen.
        </Checkbox>
      </Form.Item>

      <Form.Item
        label="Vor- und Nachname des/der gesetzlichen Vertreter/s"
        name="guardianName"
        rules={[{ required: isMinor, message: 'Bitte Namen des/der gesetzlichen Vertreter/s angeben.' }]}
      >
        <Input placeholder="Vor- und Nachname des/der gesetzlichen Vertreter/s" />
      </Form.Item>

      <Paragraph>Der Widerruf ist zu richten an: S.u.S. Volmarstein … oder per E-Mail an: sus-volmarstein@gmx.de</Paragraph>

      <Paragraph>
        <Text strong>Einverständniserklärung – Verwendung des Spielerfotos</Text>
      </Paragraph>

      <Form.Item name="photoRightsGuarantee" valuePropName="checked">
        <Checkbox>
          Der Spieler/die Spielerin … sichert zu, über alle Bildrechte zu verfügen …
        </Checkbox>
      </Form.Item>

      <Form.Item name="photoUsageConsentAssoc" valuePropName="checked">
        <Checkbox>
          Einwilligung zur Nutzung/Übermittlung des Fotos an SuS Volmarstein, FLVW Kreis 13, DFB-Medien GmbH &amp; Co. KG in Print- und Online-Medien (z. B. FUSSBALL.DE).
        </Checkbox>
      </Form.Item>

      <Form.Item name="photoUsageConsentFinal" valuePropName="checked">
        <Checkbox>
          Ich habe die oben genannte Einverständniserklärung zur Nutzung des Spielerfotos gelesen, verstanden und akzeptiert.
        </Checkbox>
      </Form.Item>

      <Paragraph>
        <Text strong>Zusatzerklärungen für Minderjährige unter 16 Jahren</Text>
      </Paragraph>

      <Form.Item name="u16MatchReportsConsent" valuePropName="checked">
        <Checkbox>
          <Text strong>1. Einwilligung in die Veröffentlichung von Spielberichten</Text>
        </Checkbox>
      </Form.Item>
      <Paragraph>
        Veröffentlichung u. a. von Namen, Einsatzzeiten, Toren, Statistiken in Vereins-/Verbandsmedien und FUSSBALL.DE.
      </Paragraph>

      <Form.Item name="u16PlayerProfileConsent" valuePropName="checked">
        <Checkbox>
          <Text strong>2. Einwilligung in die Veröffentlichung eines Spielerprofils (optional)</Text>
        </Checkbox>
      </Form.Item>
      <Paragraph>
        Registrierung in DFBnet/FUSSBALL.DE; Pflege eigener Profildaten, Fotos, Texte, Kommentare.
      </Paragraph>

      <Paragraph>
        <Text strong>Mir ist bekannt, dass ich meine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen kann.</Text>
      </Paragraph>

      <Form.Item name="u16ParentPublicationConsent" valuePropName="checked">
        <Checkbox>
          Ich, der o.g. Erziehungsberechtige, bin mit der Ver&ouml;ffentlichung der pers&ouml;nlichen Daten meines Minderj&auml;hrigen Kindes einverstanden. Ich habe die Bedingungen und meine Rechte verstanden und akzeptiere diese.
        </Checkbox>
      </Form.Item>
    </Form>
  );
});

export default Step4;
