'use client';

import Registration from '@/models/registration.model';
import { Checkbox, Form, Input, Radio, Typography, Flex } from 'antd';
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';

type Props = {
  registration: Registration;
  setRegistration: (registration: Registration) => void;
};

export type Step6Handle = {
  validate: () => Promise<boolean>;
};

const { Paragraph, Text } = Typography;

const YOUTH_OPTIONS = [
  { label: 'A-Jugend', value: 'A' },
  { label: 'B-Jugend', value: 'B' },
  { label: 'C-Jugend', value: 'C' },
  { label: 'D-Jugend', value: 'D' },
  { label: 'E-Jugend', value: 'E' },
  { label: 'F-Jugend', value: 'F' },
  { label: 'G-Jugend', value: 'G' },
];

const Step6 = forwardRef<Step6Handle, Props>(function Step6({ registration, setRegistration }, ref) {
  const [form] = Form.useForm();

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

  // Initial aus Parent übernehmen
  useEffect(() => {
    form.setFieldsValue({
      youthCategories: (registration as any).youthCategories ?? [],
      healthFitnessStatus: (registration as any).healthFitnessStatus ?? undefined,
      healthRestrictions: (registration as any).healthRestrictions ?? '',
      healthMedications: (registration as any).healthMedications ?? '',
      healthConsent: (registration as any).healthConsent ?? false,
    });
  }, [registration, form]);

  // Formularänderungen -> Parent-State spiegeln
  const onValuesChange = (_: any, allValues: any) => {
    setRegistration({ ...registration, ...allValues });
  };

  const fitnessIsConditional =
    form.getFieldValue('healthFitnessStatus') === 'conditional';

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Paragraph><Text strong>Gesundheitsbescheinigung</Text></Paragraph>

      {/* Jugend-Kategorien */}
      <Form.Item
        label="Jugend-Kategorie(n)"
        name="youthCategories"
        rules={[
          {
            validator: (_, v: string[]) =>
              v && v.length > 0
                ? Promise.resolve()
                : Promise.reject('Bitte mindestens eine Jugend-Kategorie auswählen.'),
          },
        ]}
      >
        <Checkbox.Group style={{ width: '100%' }}>
          <Flex wrap="wrap" gap={12}>
            {YOUTH_OPTIONS.map(opt => (
              <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
            ))}
          </Flex>
        </Checkbox.Group>
      </Form.Item>

      <Paragraph>Hiermit bestätigen wir, dass unser/e Sohn/Tochter:</Paragraph>

      {/* Gesundheitsstatus (exakt eine Auswahl) */}
      <Form.Item
        label="Gesundheitsstatus"
        name="healthFitnessStatus"
        rules={[{ required: true, message: 'Bitte Gesundheitsstatus auswählen.' }]}
      >
        <Radio.Group>
          <Radio value="fit">
            Sporttauglich ist und an keinerlei uns bekannten Erkrankungen leidet, die die Teilnahme am Fußballsport einschränken oder verhindern.
          </Radio>
          <br />
          <Radio value="conditional">Bedingt sporttauglich ist.</Radio>
        </Radio.Group>
      </Form.Item>

      {/* Einschränkungen (Pflicht, wenn 'bedingt' gewählt) */}
      <Form.Item
        label="Folgende Einschränkungen liegen vor"
        name="healthRestrictions"
        rules={[
          {
            validator: (_, v: string) =>
              fitnessIsConditional
                ? (v && v.trim().length > 0
                    ? Promise.resolve()
                    : Promise.reject('Bitte die Einschränkungen angeben oder „sporttauglich“ wählen.'))
                : Promise.resolve(),
          },
        ]}
      >
        <Input.TextArea placeholder="z. B. Asthma, Knieprobleme …" autoSize={{ minRows: 2, maxRows: 6 }} />
      </Form.Item>

      {/* Medikamente (optional) */}
      <Form.Item
        label="Folgende Medikamente muss mein/e Sohn/Tochter immer bei sich haben"
        name="healthMedications"
      >
        <Input.TextArea placeholder="z. B. Asthma-Spray, Allergiemittel …" autoSize={{ minRows: 2, maxRows: 6 }} />
      </Form.Item>

      {/* Abschluss-Bestätigung (Pflicht) */}
      <Form.Item
        name="healthConsent"
        valuePropName="checked"
        rules={[
          {
            validator: (_, v) =>
              v ? Promise.resolve() : Promise.reject('Bitte die Richtigkeit der Angaben bestätigen.'),
          },
        ]}
      >
        <Checkbox>Hiermit bestätigen wir die Richtigkeit der oben gemachten Angaben</Checkbox>
      </Form.Item>
    </Form>
  );
});

export default Step6;
