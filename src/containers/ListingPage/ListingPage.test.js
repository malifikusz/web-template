import React from 'react';
import { shallow } from 'enzyme';
import { FormattedMessage } from '../../util/reactIntl';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createUser,
  createCurrentUser,
  createListing,
  createOwnListing,
  fakeIntl,
} from '../../util/test-data';
import { storableError } from '../../util/errors';
import { renderShallow } from '../../util/test-helpers';
import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_PUBLISHED,
  LISTING_STATE_CLOSED,
} from '../../util/types';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { showListingRequest, showListingError, showListing } from './ListingPage.duck';

import { ListingPageComponent } from './ListingPageHeroImage';
import ActionBarMaybe from './ActionBarMaybe';

const { UUID } = sdkTypes;
const noop = () => null;

const customConfig = {
  listingExtendedData: [
    {
      key: 'category',
      scope: 'public',
      includeForProcessAliases: ['flex-product-default-process/release-1'],
      schemaType: 'enum',
      schemaOptions: ['Cat 1', 'Cat 2'],
      indexForSearch: true,
      listingPageConfig: {
        label: 'Category',
        isDetail: true,
      },
    },
    {
      key: 'amenities',
      scope: 'public',
      includeForProcessAliases: ['flex-booking-default-process/release-1'],
      schemaType: 'multi-enum',
      schemaOptions: ['Feat 1', 'Feat 2', 'Feat 3'],
      indexForSearch: true,
      listingPageConfig: {
        label: 'Amenities',
        searchMode: 'has_all',
        group: 'secondary',
      },
    },
  ],
};
describe('ListingPage', () => {
  it('matches snapshot', () => {
    const currentUser = createCurrentUser('user-2');
    const id = 'listing1';
    const slug = 'listing1-title';
    const listing1 = createListing(id, {}, { author: createUser('user-1') });
    const listing1Own = createOwnListing(id, {}, { author: createCurrentUser('user-1') });
    const getListing = () => listing1;
    const getOwnListing = () => listing1Own;

    const props = {
      location: {
        pathname: `/l/${slug}/${id}`,
        search: '',
        hash: '',
      },
      history: {
        push: () => console.log('HistoryPush called'),
      },
      params: { id, slug },
      currentUser,
      getListing,
      getOwnListing,
      intl: fakeIntl,
      authInProgress: false,
      currentUserHasListings: false,
      isAuthenticated: false,
      onLogout: noop,
      onLoadListing: noop,
      onManageDisableScrolling: noop,
      scrollingDisabled: false,
      callSetInitialValues: noop,
      sendVerificationEmailInProgress: false,
      onResendVerificationEmail: noop,
      onInitializeCardPaymentData: noop,
      sendEnquiryInProgress: false,
      onSendEnquiry: noop,
      customConfig,
      fetchLineItemsInProgress: false,
      onFetchTransactionLineItems: () => null,
      onFetchTimeSlots: () => null,
    };

    const tree = renderShallow(<ListingPageComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  describe('Duck', () => {
    it('showListing() success', () => {
      const id = new UUID('00000000-0000-0000-0000-000000000000');
      const dispatch = jest.fn(action => action);
      const response = { status: 200 };
      const show = jest.fn(() => Promise.resolve(response));
      const sdk = { listings: { show }, currentUser: { show } };

      return showListing(id)(dispatch, null, sdk).then(data => {
        expect(data).toEqual(response);
        expect(show.mock.calls).toEqual([
          [
            expect.objectContaining({
              id,
              'imageVariant.listing-card': 'w:400;h:400;fit:crop',
              'imageVariant.listing-card-2x': 'w:800;h:800;fit:crop',
              include: ['author', 'author.profileImage', 'images'],
            }),
          ],
        ]);
        expect(dispatch.mock.calls).toEqual([
          [showListingRequest(id)],
          [expect.anything()], // fetchCurrentUser() call
          [addMarketplaceEntities(data)],
        ]);
      });
    });

    it('showListing() error', () => {
      const id = new UUID('00000000-0000-0000-0000-000000000000');
      const dispatch = jest.fn(action => action);
      const error = new Error('fail');
      const show = jest.fn(() => Promise.reject(error));
      const sdk = { listings: { show } };

      // Calling sdk.listings.show is expected to fail now

      return showListing(id)(dispatch, null, sdk).then(data => {
        expect(show.mock.calls).toEqual([
          [
            expect.objectContaining({
              id,
              'imageVariant.listing-card': 'w:400;h:400;fit:crop',
              'imageVariant.listing-card-2x': 'w:800;h:800;fit:crop',
              include: ['author', 'author.profileImage', 'images'],
            }),
          ],
        ]);
        expect(dispatch.mock.calls).toEqual([
          [showListingRequest(id)],
          [expect.anything()], // fetchCurrentUser() call
          [showListingError(storableError(error))],
        ]);
      });
    });
  });

  describe('ActionBarMaybe', () => {
    it('shows users own listing status', () => {
      const listing = createListing('listing-published', {
        state: LISTING_STATE_PUBLISHED,
      });
      const actionBar = shallow(<ActionBarMaybe isOwnListing listing={listing} editParams={{}} />);
      const formattedMessages = actionBar.find(FormattedMessage);
      expect(formattedMessages.length).toEqual(2);
      expect(formattedMessages.at(0).props().id).toEqual('ListingPage.ownListing');
      expect(formattedMessages.at(1).props().id).toEqual('ListingPage.editListing');
    });
    it('shows users own pending listing status', () => {
      const listing = createListing('listing-published', {
        state: LISTING_STATE_PENDING_APPROVAL,
      });
      const actionBar = shallow(<ActionBarMaybe isOwnListing listing={listing} editParams={{}} />);
      const formattedMessages = actionBar.find(FormattedMessage);
      expect(formattedMessages.length).toEqual(2);
      expect(formattedMessages.at(0).props().id).toEqual('ListingPage.ownListingPendingApproval');
      expect(formattedMessages.at(1).props().id).toEqual('ListingPage.editListing');
    });
    it('shows users own closed listing status', () => {
      const listing = createListing('listing-closed', {
        state: LISTING_STATE_CLOSED,
      });
      const actionBar = shallow(<ActionBarMaybe isOwnListing listing={listing} editParams={{}} />);
      const formattedMessages = actionBar.find(FormattedMessage);
      expect(formattedMessages.length).toEqual(2);
      expect(formattedMessages.at(0).props().id).toEqual('ListingPage.ownClosedListing');
      expect(formattedMessages.at(1).props().id).toEqual('ListingPage.editListing');
    });
    it('shows closed listing status', () => {
      const listing = createListing('listing-closed', {
        state: LISTING_STATE_CLOSED,
      });
      const actionBar = shallow(
        <ActionBarMaybe isOwnListing={false} listing={listing} editParams={{}} />
      );
      const formattedMessages = actionBar.find(FormattedMessage);
      expect(formattedMessages.length).toEqual(1);
      expect(formattedMessages.at(0).props().id).toEqual('ListingPage.closedListing');
    });
    it("is missing if listing is not closed or user's own", () => {
      const listing = createListing('listing-published', {
        state: LISTING_STATE_PUBLISHED,
      });
      const actionBar = shallow(
        <ActionBarMaybe isOwnListing={false} listing={listing} editParams={{}} />
      );
      expect(actionBar.getElement()).toBeNull();
    });
  });
});
