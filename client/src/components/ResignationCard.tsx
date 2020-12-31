import React, { FunctionComponent } from 'react';
import { Card, Media, Image, Title } from 'rbx';
import TimeAgo from 'react-timeago';

interface Props {
    username: string;
    role: string;
    userId: number;
    at: string;
}   

const Resignation: FunctionComponent<Props> = (props) => {
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

                        <Title style={{ display: 'inline-block' }} subtitle size={5}>
                            Resigned <TimeAgo date={props.at} />
                        </Title>
                    </Media.Item>
                </Media>
            </Card.Content>
        </Card>
    )
}

export default Resignation;