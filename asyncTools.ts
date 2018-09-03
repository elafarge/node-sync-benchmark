import * as Async from 'awaity'

export const filter = async (items, iterator, limit) => {
  return Async.filterLimit(
    items,
    async item => {
      return new Promise(resolve => {
        const result = iterator(item)
        return setImmediate(() => resolve(result))
      })
    },
    limit
  )
}
