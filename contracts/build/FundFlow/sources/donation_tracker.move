module fundflow::donation_tracker {
    use one::object::UID;
    use one::tx_context::TxContext;
    use one::transfer;
    use one::event;
    use std::string::String;
    use one::coin::{Self, Coin};
    use one::oct::OCT;
    use one::balance::{Self, Balance};
    use one::table::{Self, Table};

    // Error codes
    const EInsufficientFunds: u64 = 1;
    const EUnauthorized: u64 = 2;
    const ECampaignNotActive: u64 = 3;

    // Campaign struct
    public struct Campaign has key {
        id: UID,
        owner: address,
        title: String,
        description: String,
        goal_amount: u64,
        raised_amount: u64,
        balance: Balance<OCT>,
        donors: Table<address, u64>,
        total_donors: u64,
        active: bool,
        created_at: u64,
    }

    // Donation record
    public struct DonationRecord has key, store {
        id: UID,
        campaign_id: address,
        donor: address,
        amount: u64,
        timestamp: u64,
        message: String,
    }

    // Events
    public struct CampaignCreated has copy, drop {
        campaign_id: address,
        owner: address,
        title: String,
        goal_amount: u64,
    }

    public struct DonationMade has copy, drop {
        campaign_id: address,
        donor: address,
        amount: u64,
        total_raised: u64,
    }

    public struct FundsWithdrawn has copy, drop {
        campaign_id: address,
        amount: u64,
        recipient: address,
    }

    // Create campaign
    public entry fun create_campaign(
        title: String,
        description: String,
        goal_amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        let campaign = Campaign {
            id: object::new(ctx),
            owner: sender,
            title,
            description,
            goal_amount,
            raised_amount: 0,
            balance: balance::zero(),
            donors: table::new(ctx),
            total_donors: 0,
            active: true,
            created_at: tx_context::epoch(ctx),
        };

        let campaign_addr = object::uid_to_address(&campaign.id);

        event::emit(CampaignCreated {
            campaign_id: campaign_addr,
            owner: sender,
            title: campaign.title,
            goal_amount,
        });

        transfer::share_object(campaign);
    }

    // Make donation
    public entry fun donate(
        campaign: &mut Campaign,
        payment: Coin<OCT>,
        message: String,
        ctx: &mut TxContext
    ) {
        assert!(campaign.active, ECampaignNotActive);
        
        let sender = tx_context::sender(ctx);
        let amount = coin::value(&payment);
        
        // Add to campaign balance
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut campaign.balance, payment_balance);
        
        campaign.raised_amount = campaign.raised_amount + amount;

        // Update donor record
        if (table::contains(&campaign.donors, sender)) {
            let current = table::borrow_mut(&mut campaign.donors, sender);
            *current = *current + amount;
        } else {
            table::add(&mut campaign.donors, sender, amount);
            campaign.total_donors = campaign.total_donors + 1;
        };

        // Create donation record
        let record = DonationRecord {
            id: object::new(ctx),
            campaign_id: object::uid_to_address(&campaign.id),
            donor: sender,
            amount,
            timestamp: tx_context::epoch(ctx),
            message,
        };

        event::emit(DonationMade {
            campaign_id: object::uid_to_address(&campaign.id),
            donor: sender,
            amount,
            total_raised: campaign.raised_amount,
        });

        transfer::transfer(record, sender);
    }

    // Withdraw funds (campaign owner only)
    public entry fun withdraw_funds(
        campaign: &mut Campaign,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == campaign.owner, EUnauthorized);
        assert!(balance::value(&campaign.balance) >= amount, EInsufficientFunds);

        let withdrawn = coin::take(&mut campaign.balance, amount, ctx);
        
        event::emit(FundsWithdrawn {
            campaign_id: object::uid_to_address(&campaign.id),
            amount,
            recipient: sender,
        });

        transfer::public_transfer(withdrawn, sender);
    }

    // View functions
    public fun get_campaign_info(campaign: &Campaign): (String, u64, u64, bool) {
        (campaign.title, campaign.goal_amount, campaign.raised_amount, campaign.active)
    }

    public fun get_total_donors(campaign: &Campaign): u64 {
        campaign.total_donors
    }
}
