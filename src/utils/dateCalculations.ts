/**
 * Date Calculation Utilities for GL Rule Sets
 *
 * Provides smart default date calculations when adding new rule sets
 * Based on the pattern used in jsg_pricing timeline system
 */

import { GLRuleSet } from '../types/gl-rules';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface TimelineGap {
  start: Date;
  end: Date;
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the first day of the month for a given date
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Get the last day of the month for a given date
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

/**
 * Calculate smart default dates based on existing rule sets and selected gap
 *
 * Scenarios handled:
 * 1. No rule sets exist - defaults to current month through 12 months ahead
 * 2. Before first rule set - ends day before first rule set, starts 12 months back
 * 3. Between rule sets - fills the gap with month-aligned dates
 * 4. After last rule set - starts day after last rule set, extends 12 months
 */
export function calculateDefaultDates(
  selectedGap: TimelineGap | null | undefined,
  versions: GLRuleSet[]
): DateRange {
  // Sort versions by start date
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  // Case 1: No versions exist - default to current month through 12 months
  if (sortedVersions.length === 0) {
    const startDate = getFirstDayOfMonth(new Date());
    const endDate = getLastDayOfMonth(addMonths(startDate, 11));

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  }

  // If we have a selected gap from the timeline, use it with smart adjustments
  if (selectedGap) {
    const gapStart = new Date(selectedGap.start);
    const gapEnd = new Date(selectedGap.end);
    const firstVersionStart = new Date(sortedVersions[0].start_date);
    const lastVersionEnd = new Date(sortedVersions[sortedVersions.length - 1].end_date);

    // Case 2: Before the first version
    if (gapEnd < firstVersionStart) {
      // End date is one day before the first version starts
      const endDate = new Date(Date.UTC(
        firstVersionStart.getUTCFullYear(),
        firstVersionStart.getUTCMonth(),
        firstVersionStart.getUTCDate() - 1
      ));
      // Start date is first day of month, 12 months before end date
      const startDate = getFirstDayOfMonth(addMonths(endDate, -11));

      return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      };
    }

    // Case 4: After the last version
    if (gapStart > lastVersionEnd) {
      // Start date is day after last version ends, aligned to first of month
      const dayAfterLast = new Date(Date.UTC(
        lastVersionEnd.getUTCFullYear(),
        lastVersionEnd.getUTCMonth(),
        lastVersionEnd.getUTCDate() + 1
      ));
      const startDate = getFirstDayOfMonth(dayAfterLast);
      // End date is 12 months from start, aligned to last day of month
      const endDate = getLastDayOfMonth(addMonths(startDate, 11));

      return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      };
    }

    // Case 3: Between versions - use the gap bounds with month alignment
    // Find the exact gap boundaries
    let gapStartDate = gapStart;
    let gapEndDate = gapEnd;

    // Find which versions this gap is between
    for (let i = 0; i < sortedVersions.length - 1; i++) {
      const currentEnd = new Date(sortedVersions[i].end_date);
      const nextStart = new Date(sortedVersions[i + 1].start_date);

      // Check if the gap is between these two versions
      if (gapStart >= currentEnd && gapEnd <= nextStart) {
        // Gap start is day after current version ends
        gapStartDate = new Date(Date.UTC(
          currentEnd.getUTCFullYear(),
          currentEnd.getUTCMonth(),
          currentEnd.getUTCDate() + 1
        ));
        // Gap end is day before next version starts
        gapEndDate = new Date(Date.UTC(
          nextStart.getUTCFullYear(),
          nextStart.getUTCMonth(),
          nextStart.getUTCDate() - 1
        ));
        break;
      }
    }

    // Align to month boundaries where possible, but respect gap limits
    const alignedStart = getFirstDayOfMonth(gapStartDate);
    const alignedEnd = getLastDayOfMonth(gapEndDate);

    // Make sure we don't exceed the gap boundaries
    const finalStart = alignedStart < gapStartDate ? gapStartDate : alignedStart;
    const finalEnd = alignedEnd > gapEndDate ? gapEndDate : alignedEnd;

    return {
      startDate: formatDate(finalStart),
      endDate: formatDate(finalEnd)
    };
  }

  // No gap selected - default to after the last version
  const lastVersion = sortedVersions[sortedVersions.length - 1];
  const lastVersionEnd = new Date(lastVersion.end_date);

  // Start day after last version ends
  const dayAfterLast = new Date(Date.UTC(
    lastVersionEnd.getUTCFullYear(),
    lastVersionEnd.getUTCMonth(),
    lastVersionEnd.getUTCDate() + 1
  ));
  const startDate = getFirstDayOfMonth(dayAfterLast);
  const endDate = getLastDayOfMonth(addMonths(startDate, 11));

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}
