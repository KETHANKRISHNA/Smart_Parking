import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FacilityImage } from './FacilityImage';
import { BookingStepper } from './BookingStepper';
import { ScrollToTop } from './ScrollToTop';
import { categoryOf } from '../../utils/categories';

describe('FacilityImage', () => {
  it('shows the photo when it loads', () => {
    render(<FacilityImage src="https://example.com/a.jpg" category="MALL" alt="Mall parking" className="h-10" />);
    expect(screen.getByAltText('Mall parking')).toBeInTheDocument();
  });

  it('falls back to a category panel instead of an empty box when the photo is broken', () => {
    const { container } = render(<FacilityImage src="https://example.com/gone.jpg" category="AIRPORT" alt="Airport" className="h-10" />);
    fireEvent.error(screen.getByAltText('Airport'));
    expect(screen.queryByAltText('Airport')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument(); // the category icon
  });

  it('falls back immediately when there is no photo at all', () => {
    const { container } = render(<FacilityImage category="HOSPITAL" className="h-10" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('knows every category and has a safe default', () => {
    expect(categoryOf('RAILWAY_STATION').label).toBe('Railway station');
    expect(categoryOf('SOMETHING_NEW').label).toBe('Parking');
  });
});

describe('BookingStepper', () => {
  it('marks the current step for assistive technology and completes earlier ones', () => {
    render(<BookingStepper current={3} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('shows every step as done once the booking is complete', () => {
    const { container } = render(<BookingStepper current={5} />);
    expect(container.querySelectorAll('li[aria-current="step"]')).toHaveLength(0);
    expect(container.querySelectorAll('svg')).toHaveLength(4); // a check icon per step
  });
});

describe('ScrollToTop', () => {
  it('scrolls to the top when the page changes', () => {
    window.scrollTo = (opts) => {
      window.__scrolled = opts;
    };
    render(
      <MemoryRouter initialEntries={['/payment']}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(window.__scrolled).toMatchObject({ top: 0 });
  });
});
