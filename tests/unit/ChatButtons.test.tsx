// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatButtons } from '@/components/site/ChatButtons';

describe('<ChatButtons>', () => {
  it('renders both buttons when both IDs present (inline variant)', () => {
    render(
      <ChatButtons
        zaloPhone="0912345678"
        messengerPageId="123456789012345"
        variant="inline"
      />
    );
    const zalo = screen.getByRole('link', { name: /chat qua zalo/i });
    expect(zalo).toHaveAttribute('href', 'https://zalo.me/0912345678');
    expect(zalo).toHaveAttribute('target', '_blank');
    expect(zalo).toHaveAttribute('rel', 'noopener noreferrer');

    const messenger = screen.getByRole('link', { name: /chat qua messenger/i });
    expect(messenger).toHaveAttribute('href', 'https://m.me/123456789012345');
  });

  it('renders both buttons (floating variant) without text labels', () => {
    render(
      <ChatButtons
        zaloPhone="0912345678"
        messengerPageId="123456789012345"
        variant="floating"
      />
    );
    // The visible label "Chat Zalo" should NOT exist in floating mode;
    // only the sr-only label is present.
    expect(screen.queryByText('Chat Zalo')).not.toBeInTheDocument();
    expect(screen.queryByText('Chat Messenger')).not.toBeInTheDocument();
    // But the links themselves do exist (via sr-only).
    expect(screen.getByRole('link', { name: /chat qua zalo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /chat qua messenger/i })).toBeInTheDocument();
  });

  it('hides only the Zalo button when Zalo ID is missing', () => {
    render(
      <ChatButtons
        zaloPhone={null}
        messengerPageId="123456789012345"
        variant="inline"
      />
    );
    expect(screen.queryByRole('link', { name: /chat qua zalo/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /chat qua messenger/i })).toBeInTheDocument();
  });

  it('hides only the Messenger button when Page ID is invalid (too short)', () => {
    render(
      <ChatButtons
        zaloPhone="0912345678"
        messengerPageId="12345"
        variant="inline"
      />
    );
    expect(screen.getByRole('link', { name: /chat qua zalo/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /chat qua messenger/i })).not.toBeInTheDocument();
  });

  it('hides both buttons and renders nothing when both IDs missing', () => {
    const { container } = render(
      <ChatButtons zaloPhone={null} messengerPageId={null} variant="inline" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('strips non-digits from Zalo phone before building URL', () => {
    render(<ChatButtons zaloPhone="+84 912 345 678" messengerPageId={null} variant="inline" />);
    expect(screen.getByRole('link', { name: /chat qua zalo/i })).toHaveAttribute(
      'href',
      'https://zalo.me/84912345678'
    );
  });
});
