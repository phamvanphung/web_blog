import { ContactForm } from '@/components/site/ContactForm';
import { NewsletterForm } from '@/components/site/NewsletterForm';

type Props = {
  formType: 'contact' | 'newsletter';
  heading?: string;
  body?: string;
};

export function FormBlock({ formType, heading, body }: Props) {
  return (
    <div>
      {heading && <h2 className="text-d-sm">{heading}</h2>}
      {body && <p className="mt-sm text-ink-muted-80">{body}</p>}
      <div className="mt-md">
        {formType === 'contact' ? (
          <ContactForm />
        ) : formType === 'newsletter' ? (
          <NewsletterForm />
        ) : null}
      </div>
    </div>
  );
}
