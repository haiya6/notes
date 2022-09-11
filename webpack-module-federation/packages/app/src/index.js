(async () => {
  const { add } = await import('modulea/add')
  const { sayHello } = await import('modulea/say')

  console.log('app', add(1, 3))
  sayHello()
})()