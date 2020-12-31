import React, { useState, useContext } from 'react';
import { Navbar, Image, Button } from 'rbx';
import { Link } from 'react-router-dom';

import TrackerContext from '../context/TrackerContext';

import MainLogo from '../assets/main.png';
import ExecTeam from '../assets/execteam.png';
import ModTeam from '../assets/modteam.png';
import AppTeam from '../assets/appteam.png';
import DevTeam from '../assets/devteam.png'

const Header = () => {
    const trackerState = useContext(TrackerContext);

    const [open, setOpen] = useState(false);

    const close = (...args: any[]) => setOpen(false);

    return (
        <header>
            <Navbar managed active={open}>
                <Navbar.Brand>
                    <Navbar.Item as='div'>
                        <Image src={MainLogo} alt="Soro's Logo" />
                    </Navbar.Item>

                    <Navbar.Item as="h1" style={{ fontWeight: 600 }}>Soro's Tracker</Navbar.Item>

                    <Navbar.Burger onClick={() => setOpen(open ? false : true)} />
                </Navbar.Brand>

                <Navbar.Menu>
                    <Navbar.Segment align="start">
                        <Navbar.Item as={Link} onClick={close} to="/">Activity Tracker</Navbar.Item>

                        <Navbar.Item as={Link} onClick={close} to="/resignations">Resignations & Terminations</Navbar.Item>

                        <Navbar.Item as={Link} onClick={close} to="/promotions">Promotion Tracker</Navbar.Item>

                        <Navbar.Item as={Link} onClick={close} to="/about">About</Navbar.Item>

                        <Navbar.Item dropdown hoverable>
                            <Navbar.Link>Soro's Groups</Navbar.Link>

                            <Navbar.Dropdown boxed>
                                <Navbar.Item href="https://www.roblox.com/groups/1108927/Soros-Restaurant-Franchise#!/about" target="_blank" rel="noreferrer">
                                    <Image src={MainLogo} className="navbar-logo" />
                                    Main Group
                                </Navbar.Item>
                                <Navbar.Divider />
                                <Navbar.Item href="https://www.roblox.com/groups/2767691/Soros-Executive-Branch#!/about" target="_blank" rel="noreferrer">
                                    <Image src={ExecTeam} className="navbar-logo" />
                                    Executive Group
                                </Navbar.Item>
                                <Navbar.Item href="https://www.roblox.com/groups/3320579/Soros-Moderation-Team#!/about" target="_blank" rel="noreferrer">
                                    <Image src={ModTeam} className="navbar-logo" />
                                    Mod Group
                                </Navbar.Item>
                                <Navbar.Item href="https://www.roblox.com/groups/2783465/Soros-Development-Team#!/about" target="_blank" rel="noreferrer">
                                    <Image src={DevTeam} className="navbar-logo" />
                                    Development Group
                                </Navbar.Item>
                                <Navbar.Item href="https://www.roblox.com/groups/3440607/Soros-Application-Team#!/about" target="_blank" rel="noreferrer">
                                    <Image src={AppTeam} className="navbar-logo" />
                                    Application Team
                                </Navbar.Item>
                            </Navbar.Dropdown>
                        </Navbar.Item>
                    </Navbar.Segment>

                    <Navbar.Segment align="end">
                        <Navbar.Item as="div">
                            <Button as="a" href={trackerState.discordInvite} target="_blank" rel="noreferrer" color="link">
                                <strong className="has-text-white-bis">Discord</strong>
                            </Button>
                        </Navbar.Item>
                    </Navbar.Segment>
                </Navbar.Menu>
            </Navbar>
        </header>
    )
}

export default Header;