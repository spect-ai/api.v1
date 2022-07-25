export class GetUserByIdQuery {
  constructor(public readonly id: string) {}
}

export class GetUserByUsernameQuery {
  constructor(public readonly username: string) {}
}
