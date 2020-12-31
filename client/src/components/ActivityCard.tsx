import React, { FunctionComponent } from 'react';
import { Card, Media, Image, Title } from 'rbx';
import requirements from '../requirements';

interface Role {
	name: string;
	color: string;
};

interface Props {
    username: string;
    role: string;
    minutes: number;
    userId: number;
    inGame: boolean;
    roles: Role[];
}

const User: FunctionComponent<Props> = (props) => {
    const reqs = requirements[props.role];

    return (
        <Card>
            <Card.Content>
                <Media>
                    <Media.Item align="left">
                        <figure className="image is-48x48">
                            <Image rounded loading="lazy" src={`https://www.roblox.com/headshot-thumbnail/image?userId=${props.userId}&width=180&height=180&format=png`}></Image>
                        </figure>
                    </Media.Item>

                    <Media.Item align="content">
                        <Title size={4} style={{ marginBottom: 5 }}>
                            <a href={`https://www.roblox.com/users/${props.userId}/profile`}>{ `${props.username} ` }</a>
                            ({props.role})
                        </Title>

                        <Title style={{ display: 'inline-block', marginBottom: 0 }} subtitle size={5}>{props.minutes}{reqs && `/${reqs}`} Minutes</Title>
                        
                        {reqs &&
                            <span className="badge" style={{ backgroundColor: reqs <= props.minutes ? '#0d6efd' : '#dc3545' }}>{reqs <= props.minutes ? 'Reqs Met' : 'Reqs Not Met'}</span>
                        }

                        {props.inGame &&
                            <span className="badge" style={{ backgroundColor: '#14a64e' }}>In-Game</span>
                        }

                        {
                            props.roles.map(role => (
                                <span className="badge" style={{ backgroundColor: role.color }}>{role.name}</span>
                            ))
                        }
                    </Media.Item>
                </Media>
            </Card.Content>
        </Card>
    )
}

export default User;