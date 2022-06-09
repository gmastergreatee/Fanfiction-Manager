using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using NovelDownloader_v2.RendererRelated.Models;

namespace NovelDownloader_v2.RendererRelated
{
    public partial class TestRendererControlsForm : Form
    {
        IRendererMethods Operations { get; set; }

        public TestRendererControlsForm(IRendererMethods operations)
        {
            InitializeComponent();
            Operations = operations;

            Globals.OnTestRendererEvent += OnTestRendererEvent;
        }

        private void OnTestRendererEvent(object sender, RendererEvent e)
        {
            var status = RendererEvent.RendererEventStatus(e);

            Invoke(new Action(() =>
            {
                btnBack.Enabled = Operations.Browser.CanGoBack;
                btnForward.Enabled = Operations.Browser.CanGoForward;
                btnStop.Enabled = Operations.Browser.IsLoading;

                lblStatus.Text = string.IsNullOrWhiteSpace(status) ? "NA" : status;
            }));
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            if (Operations.Browser.CanGoBack)
                Operations.Browser.BrowserCore.GoBack();
        }

        private void btnForward_Click(object sender, EventArgs e)
        {
            if (Operations.Browser.CanGoForward)
                Operations.Browser.BrowserCore.GoForward();
        }

        private void btnGo_Click(object sender, EventArgs e)
        {
            Operations.Browser.Load(txtUrl.Text.Trim());
        }

        private void btnStop_Click(object sender, EventArgs e)
        {
            if (Operations.Browser.IsLoading)
                Operations.Browser.BrowserCore.StopLoad();
        }
    }
}
