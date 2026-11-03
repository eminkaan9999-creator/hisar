import UIKit

/// Sensör seçici (Web Bluetooth'taki requestDevice penceresinin karşılığı): bulunan sensörler sırayla listelenir,
/// sinyal gücü saniyede bir yenilenir. Dokununca seçilir; İptal ya da aşağı kaydırma vazgeçer.
final class DeviceChooser: UITableViewController, UIAdaptivePresentationControllerDelegate {
    static let searching = "Aranıyor… Sensör açık olmalı; ekranında BEKLİYOR yazar."

    var rows: [(String, String)] = []
    var onPick: ((Int) -> Void)?
    var onCancel: (() -> Void)?
    private var status = DeviceChooser.searching
    private let spinner = UIActivityIndicatorView(style: .medium)

    init() { super.init(style: .insetGrouped) }
    required init?(coder: NSCoder) { fatalError("init(coder:) kullanılmaz") }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Sensör seç"
        navigationItem.leftBarButtonItem = UIBarButtonItem(title: "İptal", style: .plain, target: self, action: #selector(cancelTapped))
        navigationItem.rightBarButtonItem = UIBarButtonItem(customView: spinner)
        spinner.startAnimating()
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "c")
        tableView.register(UITableViewHeaderFooterView.self, forHeaderFooterViewReuseIdentifier: "h")
        tableView.estimatedSectionHeaderHeight = 44
        tableView.sectionHeaderHeight = UITableView.automaticDimension
    }

    func setStatus(_ s: String, searching: Bool) {
        status = s
        if searching { spinner.startAnimating() } else { spinner.stopAnimating() }
        if isViewLoaded { tableView.reloadData() }
    }

    func reload() {
        if isViewLoaded { tableView.reloadData() }
    }

    override func numberOfSections(in tableView: UITableView) -> Int { 1 }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { rows.count }

    override func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let v = tableView.dequeueReusableHeaderFooterView(withIdentifier: "h") ?? UITableViewHeaderFooterView(reuseIdentifier: "h")
        var c = UIListContentConfiguration.groupedHeader()
        c.text = status
        c.textProperties.numberOfLines = 0
        c.textProperties.transform = .none
        v.contentConfiguration = c
        return v
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "c", for: indexPath)
        var c = UIListContentConfiguration.subtitleCell()
        c.text = rows[indexPath.row].0
        c.secondaryText = rows[indexPath.row].1
        c.secondaryTextProperties.color = .secondaryLabel
        c.image = UIImage(systemName: "dot.radiowaves.left.and.right")
        cell.contentConfiguration = c
        cell.accessoryType = .disclosureIndicator
        return cell
    }

    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        onPick?(indexPath.row)
    }

    @objc private func cancelTapped() { onCancel?() }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { onCancel?() }
}
