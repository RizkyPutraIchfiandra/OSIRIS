/** A source produced nothing usable. The message is safe to show to a reader. */
export class SourceUnavailableError extends Error {
  readonly sourceId: string;

  constructor(sourceId: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SourceUnavailableError';
    this.sourceId = sourceId;
  }
}
