import { Menu, MenuItem, Popover, Position } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'

import { controlButton } from '../commons/controlButton'
import About from './about'

type DropdownProps = {
  handleLogOut: () => void
  username?: string
}

type DropdownState = {
  isAboutOpen: boolean
  isHelpOpen: boolean
  isProfileOpen: boolean
}

class Dropdown extends React.Component<DropdownProps, DropdownState> {
  constructor(props: DropdownProps) {
    super(props)
    this.state = {
      isAboutOpen: false,
      isHelpOpen: false,
      isProfileOpen: false
    }
  }

  public render() {
    return (
      <>
        <Popover
          content={this.menu(this.props)}
          inheritDarkTheme={false}
          position={Position.BOTTOM}
        >
          {controlButton('', IconNames.CARET_DOWN)}
        </Popover>
        <About isOpen={this.state.isAboutOpen} onClose={this.toggleAboutOpen} />
      </>
    )
  }

  private menu(props: DropdownProps) {
    const profile = this.props.username ? (
      <MenuItem
        icon={IconNames.USER}
        onClick={this.toggleProfileOpen}
        text={titleCase(this.props.username)}
      />
    ) : null

    const logout = this.props.username ? (
      <MenuItem icon={IconNames.LOG_OUT} text="Logout" onClick={this.props.handleLogOut} />
    ) : null

    return (
      <Menu>
        {profile}
        <MenuItem icon={IconNames.HELP} onClick={this.toggleAboutOpen} text="About" />
        <MenuItem icon={IconNames.ERROR} onClick={this.toggleHelpOpen} text="Help" />
        {logout}
      </Menu>
    )
  }

  private toggleAboutOpen = () => {
    this.setState({...this.state, isAboutOpen: !this.state.isAboutOpen})
  }

  private toggleHelpOpen = () =>
    this.setState({...this.state, isHelpOpen: !this.state.isHelpOpen})

  private toggleProfileOpen = () =>
    this.setState({...this.state, isProfileOpen: !this.state.isProfileOpen})
}

const titleCase = (str: string) =>
  str.replace(/\w\S*/g, wrd => wrd.charAt(0).toUpperCase() + wrd.substr(1).toLowerCase())

export default Dropdown
