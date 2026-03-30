'use client';

import Registration from '@/models/registration.model';
import { Form, Input, Radio, Checkbox } from 'antd';
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

type Props = {
  registration: Registration;
  setRegistration: React.Dispatch<React.SetStateAction<Registration>>;
};

export type Step2Handle = {
  validate: () => Promise<boolean>;
};

const STORAGE_KEY = 'registrationStep2:v2';

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const out: any = Array.isArray(target) ? [...(target as any)] : { ...target };
  for (const [k, v] of Object.entries(source as any)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] !== null) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

const Step2 = forwardRef<Step2Handle, Props>(function Step2({ registration, setRegistration }, ref) {
  const [form] = Form.useForm();
  const saveTimer = useRef<number | null>(null);

  const persist = (values: any) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
  };

  // Exponierte Methode: Validieren + final speichern
  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        const values = await form.validateFields();
        persist(values); // final speichern
        return true;
      } catch (err: any) {
        const first = err?.errorFields?.[0];
        if (first?.name) {
          // @ts-ignore name kann string|string[]
          form.scrollToField(first.name, { block: 'center' });
        }
        return false;
      }
    },
  }));

  // Laden aus localStorage / initialisieren
  useEffect(() => {
    const saved = typeof window !== 'undefined'
      ? safeParse<Partial<Registration>>(localStorage.getItem(STORAGE_KEY))
      : null;

    if (saved) {
      form.setFieldsValue(saved);
      setRegistration(prev => deepMerge(prev, saved));
    } else {
      form.setFieldsValue(registration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Externe Änderungen spiegeln
  useEffect(() => {
    form.setFieldsValue(registration);
  }, [registration, form]);

  // Multi-Tab Sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const incoming = safeParse<Partial<Registration>>(e.newValue);
        if (incoming) {
          form.setFieldsValue(incoming);
          setRegistration(prev => deepMerge(prev, incoming));
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [form, setRegistration]);

  // Änderungen -> State + debounced persist
  const onValuesChange = (_: any, allValues: any) => {
    setRegistration(prev => deepMerge(prev, allValues));
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => persist(allValues), 300);
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange} initialValues={registration}>
      <Form.Item label="Beitritt ab" name="entryDate" rules={[{ required: true, message: 'Bitte Eintrittsdatum wählen.' }]}>
        <Input type="date" />
      </Form.Item>

      <Form.Item label="Art der Mitgliedschaft" name="typeOfMembership" rules={[{ required: true, message: 'Bitte Mitgliedschaft wählen.' }]}>
        <Radio.Group options={[{ value: 'a', label: 'aktiv' }, { value: 'p', label: 'passiv' }]} />
      </Form.Item>

      <Form.Item label="Geschlecht" name="gender" rules={[{ required: true, message: 'Bitte Geschlecht wählen.' }]}>
        <Radio.Group options={[{ value: 'm', label: 'männlich' }, { value: 'w', label: 'weiblich' }, { value: 'd', label: 'divers' }]} />
      </Form.Item>

      <Form.Item label="Vorname" name="firstName" rules={[{ required: true, message: 'Bitte Vornamen eingeben.' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Nachname" name="lastName" rules={[{ required: true, message: 'Bitte Nachnamen eingeben.' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Geburtsdatum" name="birthDate" rules={[{ required: true, message: 'Bitte Geburtsdatum eingeben.' }]}>
        <Input type="date" />
      </Form.Item>
      <Form.Item label="Geburtsort" name="birthCity" rules={[{ required: true, message: 'Bitte Geburtsort eingeben.' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Adresse" name="address" rules={[{ required: true, message: 'Bitte Straße & Hausnummer eingeben.' }]}>
        <Input placeholder="Straße und Hausnummer" />
      </Form.Item>

      {/* NEU: PLZ + Stadt */}
      <Form.Item label="PLZ" name="postalCode" rules={[
        { required: true, message: 'Bitte PLZ eingeben.' },
        { pattern: /^\d{5}$/, message: 'PLZ muss 5 Ziffern haben.' },
      ]}>
        <Input inputMode="numeric" maxLength={5} />
      </Form.Item>

      <Form.Item label="Stadt" name="city" rules={[{ required: true, message: 'Bitte Stadt eingeben.' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="E-Mail" name="email" rules={[
        { required: true, message: 'Bitte E-Mail eingeben.' },
        { type: 'email', message: 'Bitte gültige E-Mail eingeben.' },
      ]}>
        <Input type="email" />
      </Form.Item>

      <Form.Item label="Telefonnummer" name="phone" rules={[{ required: true, message: 'Bitte Telefonnummer eingeben.' }]}>
        <Input type="tel" />
      </Form.Item>

      <Form.Item
        label="Haftungsausschluss"
        name="checkDisclaimerInjuries"
        valuePropName="checked"
        rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject('Bitte zustimmen.')) }]}
      >
        <Checkbox>
          Der Verein haftet nicht für die bei der Sportausübung entstandenen Verletzungen. Jedes Vereinsmitglied ist jedoch durch die Deutsche Sporthilfe e.V. gegen Unfälle versichert. Das Vereinsmitglied ist für die Unfallmeldung (Vordrucke sind auf Anfrage erhältlich) an die Jugendabteilung selbst verantwortlich. Ich bestätige, dass ich diesen Haftungsausschluss gelesen habe und stimme diesem zu.
        </Checkbox>
      </Form.Item>

      <h2>SEPA-Lastschrift / Einzugsermächtigung</h2>

      <Form.Item label="Name des Kontoinhabers" name={['bankAccount', 'accountHolder']} rules={[{ required: true, message: 'Bitte Kontoinhaber eingeben.' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="IBAN" name={['bankAccount', 'iban']} rules={[
        { required: true, message: 'Bitte IBAN eingeben.' },
        { pattern: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/, message: 'Bitte gültige IBAN eingeben.' },
      ]}>
        <Input />
      </Form.Item>
      <Form.Item label="BIC" name={['bankAccount', 'bic']}>
        <Input />
      </Form.Item>
      <Form.Item label="Bankname" name={['bankAccount', 'bankName']} rules={[{ required: true, message: 'Bitte Bankname eingeben.' }]}>
        <Input />
      </Form.Item>

      <Form.Item
        label="Einverständnis"
        name={['bankAccount', 'checkSEPA']}
        valuePropName="checked"
        rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject('Bitte zustimmen.')) }]}
      >
        <Checkbox>
          Hiermit ermächtige ich den S.u.S. Volmarstein 12 / 26 e.V. (Jugendabteilung), den fälligen Mitgliedsbeitrag abzubuchen. Kontoänderungen sind unbedingt rechtzeitig zu melden. Barzahlung ist nicht möglich.
        </Checkbox>
      </Form.Item>
    </Form>
  );
});

export default Step2;

// zum Leeren nach Abschluss:
export function clearLocalRegistrationDraft() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
