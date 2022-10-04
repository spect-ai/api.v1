export class GetCircleNavigationQuery {
  constructor(
    public readonly id: string,
    public readonly maxChildrenDepth?: number,
    public readonly maxParentsDepth?: number,
  ) {}
}

export class GetCircleNavigationBreadcrumbsQuery {
  constructor(public readonly id: string) {}
}
