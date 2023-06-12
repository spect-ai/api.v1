import * as React from 'react';
import { Injectable } from '@nestjs/common';
import {
  render,
  MjmlBody,
  Mjml,
  MjmlHead,
  MjmlFont,
  MjmlPreview,
  MjmlSection,
  MjmlColumn,
  MjmlText,
  MjmlImage,
  MjmlDivider,
  MjmlButton,
} from 'mjml-react';
import { Collection } from 'src/collection/model/collection.model';
import { Circle } from 'src/circle/model/circle.model';
import { User } from 'src/users/model/users.model';

@Injectable()
export class EmailGeneratorService {
  generateDigestEmail(data: Collection[], caller: User) {
    const { html, errors } = render(
      <Mjml>
        <MjmlHead>
          <MjmlPreview>{`Here's ${data?.length} ${
            data.length > 1 ? 'opportunities' : 'opportunity'
          } just for you.`}</MjmlPreview>
        </MjmlHead>

        <MjmlBody background-color="#f7f7f7">
          <MjmlSection>
            <MjmlColumn>
              {/* <MjmlImage
                width="100px"
                src="/"
              ></MjmlImage> */}
              <MjmlText font-size="30px" font-weight="bold" color="#ae5fe2">
                Your curated opportunities are here!
              </MjmlText>
              <MjmlDivider border-color="#ae5fe2" border-width="2px" />
            </MjmlColumn>
          </MjmlSection>
          {data.map((item) => {
            return (
              <MjmlSection key={item.slug}>
                <MjmlColumn>
                  <MjmlText align="left" color="#ae5fe2" font-size="30px">
                    {item.name}
                  </MjmlText>
                  <MjmlText align="left" color="#000" font-size="15px">
                    {`Created by ${
                      (item.parents[0] as unknown as Circle)?.name
                    }`}
                  </MjmlText>
                </MjmlColumn>
                <MjmlColumn>
                  <MjmlButton
                    background-color="#ecdef3"
                    align="right"
                    border="1px solid #d9d9d9"
                    color="#ae5fe2"
                    font-weight="bold"
                    border-radius="6px"
                    href={`https://circles.spect.network/r/${item.slug}`}
                  >
                    Apply
                  </MjmlButton>
                </MjmlColumn>
              </MjmlSection>
            );
          })}
        </MjmlBody>
      </Mjml>,

      { validationLevel: 'soft' },
    );

    return html;
  }

  generateEmailWithMessage(message: string, link?: string, circle?: Circle) {
    const { html, errors } = render(
      <Mjml>
        <MjmlHead>
          {`You have a new notification ${
            circle ? `from ${circle.name}!` : '!'
          }`}
        </MjmlHead>

        <MjmlBody background-color="#f7f7f7">
          <MjmlSection>
            <MjmlColumn>
              <MjmlText font-size="20px" color="#ae5fe2">
                {message}
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
          {link && (
            <MjmlSection>
              <MjmlColumn>
                <MjmlButton
                  background-color="#ecdef3"
                  align="right"
                  border="1px solid #d9d9d9"
                  color="#ae5fe2"
                  font-weight="bold"
                  border-radius="6px"
                  href={`${link}`}
                >
                  Check it out
                </MjmlButton>
              </MjmlColumn>
            </MjmlSection>
          )}
        </MjmlBody>
      </Mjml>,
    );

    return html;
  }

  generateNotificationEmail(header: string, message: string, link: string) {
    const { html, errors } = render(
      <Mjml>
        <MjmlHead>{header}</MjmlHead>

        <MjmlBody background-color="#f7f7f7">
          <MjmlSection>
            <MjmlColumn>
              <MjmlText font-size="20px" color="#ae5fe2">
                {message}
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
          <MjmlSection>
            <MjmlColumn>
              <MjmlButton
                background-color="#ecdef3"
                align="right"
                border="1px solid #d9d9d9"
                color="#ae5fe2"
                font-weight="bold"
                border-radius="6px"
                href={`${link}`}
              >
                Check it out
              </MjmlButton>
            </MjmlColumn>
          </MjmlSection>
        </MjmlBody>
      </Mjml>,
    );
    return html;
  }
}
