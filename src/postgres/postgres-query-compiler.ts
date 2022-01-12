import { DefaultQueryCompiler } from "../deps/kysely.ts";

export class PostgresQueryCompiler extends DefaultQueryCompiler {
  protected getCurrentParameterPlaceholder(): string {
    return "$" + this.numParameters;
  }

  protected override getLeftIdentifierWrapper(): string {
    return '"';
  }

  protected override getRightIdentifierWrapper(): string {
    return '"';
  }
}
