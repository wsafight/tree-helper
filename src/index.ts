
interface TreeNode {
  children: TreeNode[]
  [id: string]: any
}

export interface TreeOptions {
  idKey: string
  parentIdKey: string
  childrenKey: string
}

const DEFAULT_OPTIONS: TreeOptions = {
  idKey: 'id',
  parentIdKey: 'parentId',
  childrenKey: 'children',
}



const visitNode = (callback: Function, childrenKey: string, node: TreeNode, parentNode?: TreeNode,) => {
  callback(node, parentNode)
  if (!Array.isArray(node[childrenKey]) || !node[childrenKey].length) {
    return
  }
  node.children.forEach(child => {
    visitNode(callback, childrenKey, child, node)
  })
}

const isLeafItemForDefault = (node: TreeNode, childrenKey: string): boolean => {
  const childrenItems = node[childrenKey]
  return !Array.isArray(childrenItems) || !childrenItems.length
}

export interface TreeParams {
  items: TreeNode[]
  extraItems: TreeNode[] | TreeNode
  options: TreeOptions
}

class Tree implements TreeOptions {
  readonly idKey: string = 'id'
  readonly parentIdKey: string = 'parentId'
  readonly childrenKey: string = 'children'
  private readonly nodeById: Map<string, any> = new Map()
  private readonly rootNodes: any[] = []
  private readonly extraNodes: Record<string, any> = {}

  constructor({ items, extraItems, options }: TreeParams) {
    const { idKey, parentIdKey, childrenKey } = Object.assign({}, DEFAULT_OPTIONS, options)
    this.idKey = idKey
    this.parentIdKey = parentIdKey
    this.childrenKey = childrenKey

    if (extraItems) {
      if (!Array.isArray(extraItems)) {
        extraItems = [extraItems]
      }
      extraItems.forEach(item => {
        const node = { id: item[idKey], data: item }
        this.rootNodes.push(node)
        this.extraNodes[node.id] = node
      })
    }

    if (!Array.isArray(items) || !items.length) {
      return
    }

    items.forEach(item => {
      const node = { id: item[idKey], data: item }
      this.nodeById.set(node.id, node)
    })

    items.forEach(item => {
      this.addNode(this.nodeById.get(item[idKey]))
    })

  }

  visit(callback: Function, node?: any) {
    if (node) {
      visitNode(callback, this.childrenKey, node)
    } else {
      this.rootNodes.forEach(rootNode => {
        visitNode(callback, this.childrenKey, rootNode)
      })
    }
  }

  private addNode(node: any) {
    const parent = this.nodeById.get(node.data[this.parentIdKey])

    if (parent) {
      node.parent = parent
      if (!parent[this.childrenKey]) {
        parent[this.childrenKey] = []
      }
      parent[this.childrenKey].push(node)
    } else {
      if (node.parent) {
        delete node.parent
      }
      this.rootNodes.push(node)
    }

    if (!this.nodeById.get(node.id)) {
      this.visit((x: any) => {
        this.nodeById.set(x.id, x)
      }, node)
    }

    return this
  }

  public getRootItems() {
    const itemById = new Map()
    const rootItems: any[] = []
    this.visit((node: any) => {
      const item = Object.assign({}, node.data)
      item[this.childrenKey] = []

      const parentItem = itemById.get(item[this.parentIdKey])
      if (parentItem && !this.extraNodes[parentItem[this.idKey]]) {
        parentItem[this.childrenKey].push(item)
      } else {
        rootItems.push(item)
      }

      itemById.set(node.id, item)
    })

    rootItems.forEach(rootItem => {
      this.visit((node: any) => {
        if (!node[this.childrenKey].length) {
          delete node[this.childrenKey]
        }
      }, rootItem)
    })

    return rootItems
  }

  public getNodeById(id: string) {
    return this.nodeById.get(id) || this.extraNodes[id]
  }

  filter(filterFun: Function, nodes: any[] = this.rootNodes) {
    let index = nodes.length
    while (--index >= 0) {
      const node = nodes[index]
      if (node[this.childrenKey]?.length) {
        this.filter(filterFun, node[this.childrenKey])
      }
      if (!filterFun(node)) {
        node.splice(index, 1)
      }
    }
  }

  
}

export {
  Tree
}

export default Tree