import { buildSchema } from 'graphql';
import { oneLine, stripIndent } from 'common-tags';
import { plugin } from '../src/index';
import { diff } from 'jest-diff';
declare global {
  // eslint-disable-next-line no-redeclare
  namespace jest {
    interface Matchers<R, T> {
      /**
       * Normalizes whitespace and performs string comparisons
       */
      toBeSimilarStringTo(expected: string): R;
    }
  }
}
function compareStrings(a: string, b: string): boolean {
  return a.includes(b);
}
expect.extend({
  toBeSimilarStringTo(received: string, expected: string) {
    const strippedReceived = oneLine`${received}`.replace(/\s\s+/g, ' ');
    const strippedExpected = oneLine`${expected}`.replace(/\s\s+/g, ' ');

    if (compareStrings(strippedReceived, strippedExpected)) {
      return {
        message: () =>
          `expected
   ${received}
   not to be a string containing (ignoring indents)
   ${expected}`,
        pass: true,
      };
    } else {
      const diffString = diff(stripIndent`${expected}`, stripIndent`${received}`, {
        expand: this.expand,
      });
      const hasExpect = diffString && diffString.includes('- Expect');

      const message = hasExpect
        ? `Difference:\n\n${diffString}`
        : `expected
      ${received}
      to be a string containing (ignoring indents)
      ${expected}`;

      return {
        message: () => message,
        pass: false,
      };
    }
  },
});
describe('Prepend Response fields', () => {
  it('Should work with type fields', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type B {
        id: ID
      }
    `);
    const result = await plugin(
      schema,
      [],
      {
        prependResponseFields: [
          {
            name: '__path',
            type: 'string[]',
          },
        ],
      },
      { outputFile: '' }
    );
    expect(result.content).toBeSimilarStringTo(`
    export type B = {
      __typename?: 'B';
      __path: string[];
      id?: Maybe<Scalars['ID']>;
    };`);
  });
});
